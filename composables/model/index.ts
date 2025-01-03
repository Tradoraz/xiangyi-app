// import * as THREE from 'three'
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import model from '/xyfemale.vrm'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { PoseManager, Posed } from './pose'

setTimeout(() => {
  globalThis.THREE = THREE
})

export type IAnimationRefreshFn = (vrm: any) => void

export abstract class IAnimationInterval {
  _lastCall: number = -1
  interval: number

  constructor(interval: number) {
    this.interval = interval
  }

  abstract onCall(vrm: any): void
}

export class AnimationInterval extends IAnimationInterval {
  fn: Function
  data: any = {}

  constructor(interval: number, fn: Function) {
    super(interval)

    this.fn = fn
  }

  onCall(vrm: any) {
    this.fn(vrm)
  }
}

export class ModelManager {
  gltf: any
  renderer: any
  scene: any
  camera: any

  modelLoadBus = useEventBus('ON_MODEL_LOAD')
  modelLoadDoneBus = useEventBus('ON_MODEL_LOAD_DONE')
  modelLoadEndBus = useEventBus('ON_MODEL_LOAD_END')

  constructor() {
  }

  load(container: HTMLElement) {
    const rect = container.getBoundingClientRect()
    const { width, height } = rect

    // renderer
    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    container.appendChild(this.renderer.domElement)

    // camera
    this.camera = new THREE.PerspectiveCamera(30.0, width / height, 0.1, 20.0)
    this.camera.position.set(0.0, 1.0, 5.0)

    // camera controls
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.screenSpacePanning = true
    controls.target.set(0.0, 1.0, 0.0)
    controls.update()
    controls.enableRotate = false
    controls.enableZoom = false

    // scene
    this.scene = new THREE.Scene()
    this.setBackground()

    // light
    const light = new THREE.DirectionalLight(0xFFFFFF, Math.PI)
    light.position.set(1.0, 1.0, 1.0).normalize()
    this.scene.add(light)

    // gltf and vrm
    let currentVrm: any
    const loader = new GLTFLoader()
    loader.crossOrigin = 'anonymous'

    loader.register((parser: any) => {
      return new VRMLoaderPlugin(parser)
    })

    loader.load(model,

      // called when the resource is loaded
      (gltf: any) => {
        this.modelLoadDoneBus.emit(gltf)

        this.gltf = gltf

        const vrm = gltf.userData.vrm

        // calling these functions greatly improves the performance
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.combineSkeletons(gltf.scene)
        VRMUtils.combineMorphs(vrm)

        // Disable frustum culling
        vrm.scene.traverse((obj: any) => {
          // console.log({ obj })

          obj.frustumCulled = false
        })

        currentVrm = vrm
        console.log({ vrm }, vrm.humanoid.humanBones.head, gltf)
        this.scene.add(vrm.scene)

        this.modelLoadEndBus.emit()
      },

      // called while loading is progressing
      progress => this.modelLoadBus.emit(100.0 * (progress.loaded / progress.total), progress),

      // called when loading has errors
      error => console.error(error))

    // helpers
    // const gridHelper = new THREE.GridHelper(10, 10)
    // this.scene.add(gridHelper)

    // const axesHelper = new THREE.AxesHelper(5)
    // this.scene.add(axesHelper)

    // animate
    const clock = new THREE.Clock()
    clock.start()

    const animate = () => {
      requestAnimationFrame(animate)

      // update vrm components
      if (currentVrm) {
        currentVrm.update(clock.getDelta())

        // update animation
        for (const animateFn of this._animationList)
          animateFn(currentVrm)

        // update interval
        const now = Date.now()
        for (const intervalFn of this._intervalList) {
          if (now - intervalFn._lastCall > intervalFn.interval) {
            intervalFn._lastCall = now
            intervalFn.onCall(currentVrm)
          }
        }
      }

      // render
      this.renderer.render(this.scene, this.camera)
    }

    animate()
  }

  updateEye(x: number, y: number, vrm: any) {
    const { ndcX, ndcY } = getNormalizedMousePosition({ x, y }, this.renderer.domElement)
    const { yaw, pitch } = calculateYawPitch(ndcX, ndcY, this.camera.fov, this.camera.aspect)

    vrm.lookAt.pitch = pitch * 100
    vrm.lookAt.yaw = yaw * 100
  }

  _animationList: IAnimationRefreshFn[] = []
  _intervalList: IAnimationInterval[] = []

  onAnimate(callback: IAnimationRefreshFn) {
    this._animationList.push(callback)
  }

  onInterval(callback: IAnimationInterval) {
    this._intervalList.push(callback)
  }

  setBackground() {
    const color = getCssVariable('--el-bg-color-page')

    this.scene.background = new THREE.Color(color)
  }

  useExpression(value: string, vrm: any) {
    return vrm.expressionManager.presetExpressionMap[value]
  }

  resize(container: HTMLElement) {
    const rect = container.getBoundingClientRect()
    const { width, height } = rect

    // 更新渲染器大小
    this.renderer.setSize(width, height)

    // 更新相机的宽高比
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }
}

function getNormalizedMousePosition(pos: { x: number, y: number }, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect() // 获取画布大小
  const x = (pos.x - rect.left) / rect.width
  const y = (pos.y - rect.top) / rect.height

  const ndcX = (x - 0.5) * 2
  const ndcY = (y - 0.5) * 2
  return { ndcX, ndcY }
}

function calculateYawPitch(ndcX: number, ndcY: number, fov: number, aspectRatio: number) {
  const halfFovY = (fov * Math.PI) / 360
  const halfFovX = Math.atan(Math.tan(halfFovY) * aspectRatio)

  const yaw = ndcX * halfFovX * 2
  const pitch = ndcY * halfFovY * 2

  return { yaw, pitch }
}

function getCssVariable(varName: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

export const modelManager = new ModelManager()

globalThis.$m = modelManager

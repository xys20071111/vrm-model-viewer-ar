import { Scene, PerspectiveCamera, DirectionalLight, WebGLRenderer, AnimationMixer, Mesh, RingGeometry, MeshBasicMaterial, Clock } from 'three'
import { ARButton, GLTFLoader } from 'three/addons'
import { createVRMAnimationClip, VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation'
import ModelManager from './ModelManager'
import { VRM } from '@pixiv/three-vrm'

if (!navigator.xr) {
	alert('您的浏览器不支持WebXR')
}
if (!(await navigator.xr?.isSessionSupported('immersive-ar'))) {
	alert('您的设备不能运行沉浸式AR')
}

const logTextarea = document.querySelector('#log') as HTMLTextAreaElement
const modelUpload = document.querySelector('#modelUpload') as HTMLInputElement
const aniUpload = document.querySelector('#animationUpload') as HTMLInputElement
const loadButton = document.querySelector('#loadModelAndAnimation') as HTMLButtonElement
const createXRButton = document.querySelector('#createXR') as HTMLButtonElement

let hitTestSource: XRHitTestSource | null = null
let hitTestSourceRequested = false

createXRButton.style.display = "none"

const scene = new Scene()
const modelManager = new ModelManager()
// 初始化渲染器
const renderer = new WebGLRenderer({
	antialias: true,
	alpha: true,
	preserveDrawingBuffer: true,
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.xr.setReferenceSpaceType('local')
renderer.autoClear = false
renderer.xr.enabled = true
document.body.appendChild(renderer.domElement)

const clock = new Clock()
clock.start()

const VRMAloader = new GLTFLoader()
VRMAloader.register((parser) => {
	return new VRMAnimationLoaderPlugin(parser)
})

const camera = new PerspectiveCamera(
	70,
	window.innerWidth / window.innerHeight,
	0.01,
	20,
)

const directionalLight = new DirectionalLight(0xffffff, 2)
directionalLight.position.set(10, 15, 10)
scene.add(directionalLight)

const circle = new Mesh(
	new RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
	new MeshBasicMaterial(),
)
circle.matrixAutoUpdate = false
circle.visible = false
scene.add(circle)

let model: VRM
let vrma: any | null = null
let mixer: AnimationMixer | null = null
async function loadModelAndAnimation() {
	if (!modelUpload.files || !modelUpload.files[0]) {
		logTextarea.value += "需要VRM模型文件\n"
		return
	}
	try {
		const modelUrl = URL.createObjectURL(modelUpload.files[0])
		await modelManager.loadModel(modelUrl)
		model = modelManager.getModel() as VRM
		model.scene.visible = false
		scene.add(model.scene)
		loadButton.style.display = "none"
		createXRButton.style.display = "inline"
		logTextarea.value += "模型已加载\n"
		if (aniUpload.files && aniUpload.files[0]) {
			const aniUrl = URL.createObjectURL(aniUpload.files[0])
			vrma = (await VRMAloader.loadAsync(aniUrl)).userData.vrmAnimations[0]
			logTextarea.value += "动作已加载\n"
		}
	} catch {
		logTextarea.value += "加载失败，请重试\n"
	}
}

const controller = renderer.xr.getController(0)
function onSelect() {
	console.log('click')
	if (circle.visible && model) {
		circle.matrix.decompose(
			model.scene.position,
			model.scene.quaternion,
			model.scene.scale,
		)
		model.scene.scale.x *= 0.5
		model.scene.scale.y *= 0.5
		model.scene.scale.z *= 0.5
		model.scene.visible = true
		if (vrma) {
			const animation = createVRMAnimationClip(vrma, model)
			mixer = new AnimationMixer(model.scene)
			mixer.clipAction(animation).play()
		}
	}
}
controller.addEventListener('select', onSelect)
scene.add(controller)

async function createXR() {
	renderer.setAnimationLoop((_time: DOMHighResTimeStamp, frame: XRFrame) => {
		if (frame) {
			const session = renderer.xr.getSession()!
			const refSpace = renderer.xr.getReferenceSpace()!
			if (hitTestSourceRequested === false) {
				session.requestReferenceSpace('viewer').then(function (refSpace) {
					session!.requestHitTestSource!({ space: refSpace })!
						.then(function (source) {
							hitTestSource = source
						})
				})

				session.addEventListener('end', function () {
					hitTestSourceRequested = false
					hitTestSource = null
				})

				hitTestSourceRequested = true
			}

			if (hitTestSource) {
				const hitTestResults = frame.getHitTestResults(hitTestSource)

				if (hitTestResults.length) {
					const hit = hitTestResults[0]
					circle.visible = true
					circle.matrix.fromArray(hit!.getPose(refSpace)!.transform.matrix)
				} else {
					circle.visible = false
				}
			}
		}
		const delta = clock.getDelta()
		if (model) {
			model.update(delta)
		}
		if (mixer) {
			mixer.update(delta)
		}
		renderer.render(scene, camera)
	})

	document.body.appendChild(
		ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }),
	)
	logTextarea.value += "环境已创建，请点击页面下方的 StART AR 按钮\n"
}

loadButton.addEventListener('click', loadModelAndAnimation)
createXRButton.addEventListener('click', createXR)
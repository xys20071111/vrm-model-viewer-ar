import { VRM, MToonMaterialLoaderPlugin, VRMLoaderPlugin } from '@pixiv/three-vrm'
import { VRMLookAtQuaternionProxy } from '@pixiv/three-vrm-animation'
import { MeshBasicMaterial } from 'three'
import { GLTFLoader } from 'three/addons'

const loader = new GLTFLoader()
loader.register((parser) => {
	const material = new MToonMaterialLoaderPlugin(parser, {
		materialType: MeshBasicMaterial,
	})
	return new VRMLoaderPlugin(parser, {
		mtoonMaterialPlugin: material,
	})
})

class ModelManager {
	private currentModel: VRM | null = null

	public async loadModel(url: string) {
		const model = await loader.loadAsync(url)
		// VRMUtils.removeUnnecessaryJoints(model.scene)
		// VRMUtils.removeUnnecessaryVertices(model.scene)
		// model.scene.visible = false
		// model.scene.traverse((obj) => {
		// 	obj.frustumCulled = false
		// })
		this.currentModel = model.userData.vrm
		const lookAtQuatProxy = new VRMLookAtQuaternionProxy(this.currentModel?.lookAt!)
		lookAtQuatProxy.name = 'lookAtQuaternionProxy'
		this.currentModel?.scene.add(lookAtQuatProxy)
		// this.scene.add(this.currentModel!.scene)
	}

	public getModel(): VRM | null {
		if (this.currentModel) {
			return this.currentModel
		} else {
			return null
		}
	}

	public cleanModel() {
		if (this.currentModel) {
			// this.scene.remove(this.currentModel.scene)
			this.currentModel = null
		}
	}
}

export default ModelManager

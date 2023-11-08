<template>
  <view class="face-marks__cake">
    <Cake :isLight="isLight" />
  </view>
  <view class="face-marks__container">
    <p>{{ 'mouthRatio ' + mouthRatio }}</p>

    <view @click="handleReset" :style="{ background: '#fff' }">再来一次</view>
    <video class="face-marks__video" autoplay muted playsinline controls="false"></video>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

import * as faceapi from 'face-api.js'
import type { Point } from 'face-api.js'
import Cake from '../../components/Cake/index.vue'


let timer: NodeJS.Timer
let cam = null as unknown as HTMLVideoElement
const isLight = ref(true)
let arr = Array(5).fill(0)

const mouthRatio = ref(-1)

const getMouthRatio = (pointObj: Record<string, Point>) => {
  const { leftPoint, rightPoint, upPoint, downPoint } = pointObj
  if (!(leftPoint.x & rightPoint.x & upPoint.x & downPoint.x)) return 0
  return Math.floor(Number(getDistanc(leftPoint, rightPoint)) / Number(getDistanc(upPoint, downPoint)))
}

const title = ref('Hello')
const imgInput = ref()
const isCameraOn = ref(true)
const isReady = ref(false)

const minConfidence = 0.3;
const faceapiOptions = new faceapi.SsdMobilenetv1Options({ minConfidence });
const getDistanc = (a: Omit<faceapi.Point, '_x' | '_y'>, b: Omit<faceapi.Point, '_x' | '_y'>) => {
  if (!a || !b) return 0
  return Math.sqrt(Math.abs(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))).toFixed(2)
}
const showPosition = (p: Omit<faceapi.Point, '_x' | '_y'>) => {
  if (!p) return ''
  return `x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2)}`
}

faceapi.env.monkeyPatch({
  Canvas: HTMLCanvasElement,
  Image: HTMLImageElement,
  ImageData: ImageData,
  Video: HTMLVideoElement,
  createCanvasElement: () => document.createElement('canvas'),
  createImageElement: () => document.createElement('img')
});

const handleCameraOnOff = async (e: any) => {
  initCamera(e.detail.value)
}

const handleReset = () => {
  isLight.value = true;
  loopJudge()
}
const loadNet = async () => {
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('public/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('public/models'),
      faceapi.nets.tinyFaceDetector.loadFromUri('public/models'),
    ])
  }
  catch (error) {
    console.error(error)
  }

};

const initCamera = async (isCameraOn = true, width = 800, height = 600): Promise<HTMLVideoElement> => {
  const video = document.getElementsByTagName('video')[0] as HTMLVideoElement
  video.width = width;
  video.height = height;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: width,
      height: height
    }
  });

  // 获取视频轨道
  const videoTrack = stream.getVideoTracks()[0];
  // 关闭摄像头
  if (!isCameraOn) {
    videoTrack.stop();
  }

  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}
const detectLandmarks = async () => {

  try {
    let result = await faceapi.detectSingleFace(cam, faceapiOptions)
      .withFaceLandmarks()

    detectLandmarks()
  } catch (error) {
    console.error(error)
  }
};

const loopJudge = () => {
  timer && clearInterval(timer)
  timer = setInterval(async () => {
    try {
      // const detections = await faceapi.detectAllFaces(cam, faceapiOptions)
      const detections = await faceapi.detectAllFaces(cam, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
      if (!detections[0]) {
        console.log('no face...')
        return
      }
      console.log('facing')
      const landmarks = detections[0].landmarks
      // @ts-ignore
      const pointsArr = landmarks._positions as faceapi.Point[]

      let leftPoint = pointsArr[60] // left
      let rightPoint = pointsArr[64] // right
      let upPoint = pointsArr[62] // up
      let downPoint = pointsArr[66] // down

      const ratioRes = getMouthRatio({ leftPoint, rightPoint, upPoint, downPoint })
      mouthRatio.value = ratioRes
      const val = (ratioRes <= 6 && ratioRes >= 3) ? 1 : 0
      arr.shift()
      arr.push(val)

      const isBlowing = arr.reduce((pre, cur) => {
        return cur & pre
      }, 1)
      if (isBlowing) {
        clearInterval(timer)
        isLight.value = false;
      }
      console.log(isBlowing)


    } catch (error) {
      console.error(error)
    }
  }, 100);
}
const initFace = async () => {
  console.log('loadnet初始化')
  await loadNet()
  console.log('loadnet完毕')
  cam = await initCamera()
  console.log('相机初始化完毕')
  // await detectLandmarks();
  cam.addEventListener('play', loopJudge);
}


onMounted(async () => {
  await initFace()




})
onBeforeUnmount(() => {
  clearInterval(timer)
})






</script>

<style lang="scss">
.face-marks {
  &__cake {
    max-width: 1500rpx;
    margin: auto;
    height: 100vh;
  }

  &__container {
    outline: 1px solid;
    width: 400rpx;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 150rpx;
    left: 50%;
    transform: translateX(-50%);
  }

  &__video {
    position: absolute;
    top: 810rpx;
    width: 400rpx;
    height: 300rpx;
  }
}
</style>

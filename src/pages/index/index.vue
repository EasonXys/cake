<template>
  <view class="container">
    <view :class="isLight ? '' : 'smoke'">
      <view class="s5"></view>
      <view class="s4"></view>
      <view class="s3"></view>
      <view class="s2"></view>
      <view class="s1"></view>
    </view>
    <view class="box" v-if="isLight">
      <view class="shadow">
      </view>
    </view>
    <view class="cake">
      <view class="candle">
        <view :class="isLight ? 'wick' : 'extinguished'"></view>
        <view v-if="isLight">
          <view class="light"></view>
          <view class="light"></view>
          <view class="light"></view>
          <view class="light"></view>
          <view class="light"></view>
        </view>
      </view>
      <view class="cream"></view>
      <view class="bread"></view>
    </view>
    <view :class="isLight ? 'clock' : 'blessing'">
      <!-- {{ clock }} -->
    </view>
    <view class="face-marks__container">
      <p>{{ 'leftPoint left ' + showPosition(leftPoint) }}</p>
      <p>{{ 'rightPoint right ' + showPosition(rightPoint) }}</p>
      <p>{{ 'width ' + getDistanc(leftPoint, rightPoint) }}</p>

      <p>{{ 'upPoint up ' + showPosition(upPoint) }}</p>
      <p>{{ 'downPoint down ' + showPosition(downPoint) }}</p>
      <p>{{ 'height ' + getDistanc(upPoint, downPoint) }}</p>
      <p>{{ 'mouthRatio ' + mouthRatio }}
      </p>

      <view @click="handleReset" :style="{ background: '#fff' }">再来一次</view>
      <video class="face-marks__video" autoplay muted playsinline></video>
      <canvas class="face-marks__canvas" id="canvas"></canvas>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as faceapi from 'face-api.js'
import { onBeforeUnmount } from 'vue';


let timer: NodeJS.Timer
let count = 0
let cam = null as unknown as HTMLVideoElement
let isLight = ref(true)
let arr = Array(6).fill(0)


const leftPoint = ref(null as unknown as faceapi.Point);
const rightPoint = ref(null as unknown as faceapi.Point);
const upPoint = ref(null as unknown as faceapi.Point);
const downPoint = ref(null as unknown as faceapi.Point);

const mouthRatio = computed(() => {
  if (!upPoint.value?.x) return 0
  return Math.floor(Number(getDistanc(leftPoint.value, rightPoint.value)) / Number(getDistanc(upPoint.value, downPoint.value)))
})

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

    console.log(result)
    detectLandmarks()
  } catch (error) {
    console.error(error)
  }
};

const loopJudge = () => {
  // console.log('hello')
  // const canvas = document.getElementsByTagName('canvas')[0]
  // canvas.width = 800
  // canvas.height = 600
  // const videoEl = document.getElementsByTagName('video')[0]
  // console.log(canvas)
  // const ctx = canvas.getContext('2d');
  timer && clearInterval(timer)
  timer = setInterval(async () => {
    count++
    try {
      // const detections = await faceapi.detectAllFaces(cam, faceapiOptions)
      const detections = await faceapi.detectAllFaces(cam, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
      if (!detections[0]) {
        console.log('no face...')
        return
      }
      console.log('facing')
      const landmarks = detections[0].landmarks
      const pointsArr = landmarks._positions as faceapi.Point[]

      // if (count % 5 === 0) {
      leftPoint.value = pointsArr[60] // left
      rightPoint.value = pointsArr[64] // right
      upPoint.value = pointsArr[62] // up
      downPoint.value = pointsArr[66] // down

      const val = (mouthRatio.value <= 6 && mouthRatio.value >= 3) ? 1 : 0
      arr.shift()
      arr.push(val)
      console.table(arr)

      const isBlowing = arr.reduce((pre, cur) => {
        return cur & pre
      }, 1)
      if (isBlowing) {
        clearInterval(timer)
        isLight.value = false;
      }
      console.table(arr)
      console.log(isBlowing)

      // }
      // console.log(detections[0].landmarks._positions)
      // const dims = faceapi.matchDimensions(canvas, videoEl, true)
      // console.log(dims)
      // const resizedDetections = faceapi.resizeResults(detections, dims);


      // ctx && ctx.translate(-100, -1 * videoEl.offsetHeight);
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

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
  count = 0
})






</script>

<style lang="scss">
@import './index.scss';

.face-marks {
  &__container {
    outline: 1px solid;
    width: 600rpx;
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 50rpx;
    left: 300rpx;
  }

  &__video,
  &__canvas {
    position: absolute;
    top: 210px;
    width: 800rpx;
    height: 600rpx;
  }
}

canvas {
  outline: 1px solid red;
  // background-color: #eee;
}
</style>

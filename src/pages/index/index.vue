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
  </view>

  <!-- <view class="face-marks__container">
    <p>{{ 'Point60 left ' + showPosition(point60) }}</p>
    <p>{{ 'Point64 right ' + showPosition(point64) }}</p>
    <p>{{ 'width ' + getDistanc(point60, point64) }}</p>

    <p>{{ 'Point62 up ' + showPosition(point62) }}</p>
    <p>{{ 'Point66 down ' + showPosition(point66) }}</p>
    <p>{{ 'height ' + getDistanc(point62, point66) }}</p>
    <p>{{ 'weight/height ' + (Number(getDistanc(point60, point64)) / Number(getDistanc(point62, point66))).toFixed(2) }}
    </p>


    <video class="face-marks__video" autoplay muted playsinline></video>
    <switch checked @change="handleCameraOnOff" />
    <canvas class="face-marks__canvas" id="canvas"></canvas>
  </view> -->
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as faceapi from 'face-api.js'
import { onBeforeUnmount } from 'vue';


let timer: NodeJS.Timer
let count = 0
let cam = null as unknown as HTMLVideoElement
let isLight = ref(false)


const point60 = ref(null as unknown as faceapi.Point);
const point64 = ref(null as unknown as faceapi.Point);
const point62 = ref(null as unknown as faceapi.Point);
const point66 = ref(null as unknown as faceapi.Point);

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

const initCamera = async (isOn = true, width = 800, height = 600): Promise<HTMLVideoElement> => {
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
  if (!isOn) {
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

// const initFace = async () => {
//   console.log('loadnet初始化')
//   await loadNet()
//   console.log('loadnet完毕')
//   cam = await initCamera()
//   console.log('相机初始化完毕')
//   // await detectLandmarks();
//   cam.addEventListener('play', () => {
//     console.log('hello')
//     const canvas = document.getElementsByTagName('canvas')[0]
//     canvas.width = 800
//     canvas.height = 600
//     const videoEl = document.getElementsByTagName('video')[0]
//     console.log(canvas)
//     const ctx = canvas.getContext('2d');
//     timer = setInterval(async () => {
//       count++
//       try {
//         // const detections = await faceapi.detectAllFaces(cam, faceapiOptions)
//         const detections = await faceapi.detectAllFaces(cam, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
//         if (!detections[0]) {
//           console.log('no face...')
//           return
//         }
//         console.log('facing')
//         const landmarks = detections[0].landmarks
//         const pointsArr = landmarks._positions as faceapi.Point[]

//         // if (count % 5 === 0) {
//         point60.value = pointsArr[60] // left
//         point64.value = pointsArr[64] // right
//         point62.value = pointsArr[62] // up
//         point66.value = pointsArr[66] // down
//         // }
//         // console.log(detections[0].landmarks._positions)
//         const dims = faceapi.matchDimensions(canvas, videoEl, true)
//         console.log(dims)
//         const resizedDetections = faceapi.resizeResults(detections, dims);


//         ctx && ctx.translate(-100, -1 * videoEl.offsetHeight);
//         faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

//       } catch (error) {
//         console.error(error)
//       }
//     }, 100);
//   });
// }


onMounted(async () => {
  // await initFace()




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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    // p{

    // }

  }

  &__video,
  &__canvas {
    position: absolute;
    top: 160px;
    width: 800rpx;
    height: 600rpx;
  }
}

canvas {
  outline: 1px solid red;
  // background-color: #eee;
}
</style>

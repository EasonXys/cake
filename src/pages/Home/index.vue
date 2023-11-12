<template>
  <view class="face-marks__cake">
    <Cake :isLight="isLight" />
  </view>
  <view class="face-marks__container">
    <view class="face-marks__btn" @click="handleReset" v-if="displayText" :style="{
      transform: isLight ? '' : 'rotate(10deg)',
      opacity: isLight ? '1' : '0.5',
      boxShadow: isLight ? '0 4px 8px rgba(0, 0, 0, 0.5)' : ''
    }">{{ displayText }}</view>
    <video class="face-marks__video" autoplay muted playsinline controls="false"></video>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import * as faceapi from 'face-api.js'
import type { Point } from 'face-api.js'
import audioSrc from '../../../public/music/birthday.mp3'
import Cake from '../../components/Cake/index.vue'

const modelsSrc = './static/models'

let timer = null as unknown as NodeJS.Timer
let cam = null as unknown as HTMLVideoElement
let arr = Array(3).fill(0)

const isLight = ref(true)
const mouthRatio = ref(-1)
const isReady = ref(false)
const audio = ref(null as unknown as HTMLAudioElement)


const displayText = computed(() => {
  if (!isReady.value) return ''
  return isLight.value ? '吹灭它' : '再来一次'
})

const getMouthRatio = (pointObj: Record<string, Point>) => {
  const { leftPoint, rightPoint, upPoint, downPoint } = pointObj
  if (!(leftPoint.x & rightPoint.x & upPoint.x & downPoint.x)) return 0
  return Math.floor(Number(getDistanc(leftPoint, rightPoint)) / Number(getDistanc(upPoint, downPoint)))
}

const getDistanc = (a: Omit<faceapi.Point, '_x' | '_y'>, b: Omit<faceapi.Point, '_x' | '_y'>) => {
  if (!a || !b) return 0
  return Math.sqrt(Math.abs(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))).toFixed(2)
}

const handleReset = () => {
  if (isLight.value) return
  isLight.value = true;
  isReady.value = true;
  loopJudge()
}
const loadNet = async () => {
  try {
    await Promise.all([
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsSrc),
      faceapi.nets.tinyFaceDetector.loadFromUri(modelsSrc),
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

const loopJudge = () => {
  let count = 0
  timer && clearInterval(timer)
  timer = setInterval(async () => {
    count++
    if (count <= 10) return
    try {
      const detections = await faceapi.detectAllFaces(cam, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
      if (!detections[0]) return
      const landmarks = detections[0].landmarks
      // @ts-ignore
      const pointsArr = landmarks._positions as faceapi.Point[]

      let leftPoint = pointsArr[60] // left
      let rightPoint = pointsArr[64] // right
      let upPoint = pointsArr[62] // up
      let downPoint = pointsArr[66] // down

      const ratioRes = getMouthRatio({ leftPoint, rightPoint, upPoint, downPoint })
      if (mouthRatio.value === -1) { isReady.value = true; }
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
  cam.addEventListener('play', loopJudge);
}


onMounted(() => {
  initFace()
  audio.value = new Audio(audioSrc)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  isReady.value = false;
  initCamera(false)
})
watch(() => isLight.value, (newVal, oldVal) => {
  if (!newVal && oldVal) {
    audio.value.play();
  }
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
    top: 80rpx;
    width: 400rpx;
    height: 300rpx;
    visibility: hidden;
  }

  &__btn {
    background-color: #45a049;
    color: #fefefe;
    font-size: 40rpx;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    position: absolute;
    top: 900rpx;
    width: 250rpx;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    border: 5px solid #333;
    border-radius: 20rpx;

    display: inline-block;
    padding: 10rpx 20rpx;
    color: white;
    border: none;
    transition: transform 0.3s, box-shadow 0.3s;

    /* 定义按钮按下时的样式 */
    &:active {
      transform: scale(0.95) rotate(10deg);
    }
  }

}
</style>

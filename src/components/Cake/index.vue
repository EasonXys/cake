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
    <view :class="[isLight ? '' : 'blessing']">
      {{ isLight ? '' : '生日快乐' }}
    </view>
  </view>
</template>

<script lang="ts" setup>
interface IProps {
  isLight: boolean
}
const props = withDefaults(defineProps<IProps>(), {
  isLight: true
})


</script>

<style lang="scss" scoped>
@import './index.scss';
</style>

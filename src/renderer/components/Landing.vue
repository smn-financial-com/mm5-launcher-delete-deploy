<template>
  <div>
    <h5 class="mt-3">{{ $t('loading') }}</h5>
    <b-progress height="25px" class="mb-2">
      <b-progress-bar :value="value" :label="`${value}%`"></b-progress-bar>
    </b-progress>
  </div>
</template>

<script>
import mm2 from '../../../src/mm2/service';

export default {
  components: {
    //Progress,
  },
  data() {
    return {
      value: 0,
      progressColor: '#54B848',
    };
  },
  props: {
    baseURL: {
      type: String,
      required: true,
    },
    userToken: {
      type: String,
      required: true,
    },
  },
  mounted() {
    console.log('Landing::', this.baseURL, this.userToken);
    try {
      mm2.notifyLoginComplete(this.baseURL, this.userToken, this.progressCallback);
    } catch (err) {
      console.log('received error:', err);
    }
  },
  methods: {
    progressCallback(progress) {
      this.value = parseFloat(progress);
    },
  },
};
</script>

<style>
.vue-circular-progress .percent {
  top: 53% !important;
  left: 16% !important;
}
</style>

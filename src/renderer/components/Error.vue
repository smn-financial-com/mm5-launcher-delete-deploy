<template>
  <div>
    <div v-if="isValid()">
      <p>Advanced Dashboard: {{ $t(error) }}</p>
    </div>
    <p v-else>{{ $t('errorMsg') }}</p>
  </div>
</template>

<script>
export default {
  props: {
    error: {
      type: String,
      default: null,
    },
  },
  methods: {
    isValid() {
      return this.error && this.error.length;
    },
  },
};
</script>

<style scoped></style>

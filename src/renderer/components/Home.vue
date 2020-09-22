<template>
  <div>
    <p>{{ message() }}</p>
  </div>
</template>

<script>
export default {
  props: {
    msg: {
      type: String,
      default: null,
    },
  },
  methods: {
    message() {
      return this.msg ? this.$t(this.msg) : this.$t('loginRedirect');
    },
  },
};
</script>

<style scoped></style>

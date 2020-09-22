<template>
  <div id="app">
    <div class="main-layout">
      <b-navbar type="dark" toggleable="lg">
        <b-navbar-brand>
          <img src="./assets/icon.png" alt="TD Logo" />
        </b-navbar-brand>
        <b class="font-weight-bolder p-2">Advanced Dashboard</b>
      </b-navbar>
      <div class="body d-flex align-items-center justify-content-center">
        <div class="inner-container">
          <router-view></router-view>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>

<style lang="scss">
body {
  background-color: #0b0d0f !important;
  height: 100%;
}

html {
  position: relative;
  height: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #fff;
  font-size: 14px;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
  height: 100%;
}

.main-layout {
  display: flex;
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;
}

.body {
  position: relative;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  overflow: hidden;
}

.inner-container {
  min-width: 600px;
  text-align: center;
}

.navbar {
  position: relative;
  padding: 0 0 !important;
  background: #20272e;
  border-bottom: 2px solid #54b848;
  .navbar-brand {
    padding: 0;
  }
}

p {
  font-size: 28px;
}
</style>

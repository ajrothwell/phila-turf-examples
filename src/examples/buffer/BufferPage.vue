<script setup lang="ts">
import ExamplePage from '../../shell/ExamplePage.vue'
import DemoMap from '../../components/DemoMap.vue'
import CodePanel from '../../components/CodePanel.vue'
</script>

<template>
  <ExamplePage>
    <template #code>
      <CodePanel
        title="buffer"
        source-path="src/examples/buffer/BufferPage.vue"
      >
        <p>Coming soon.</p>
      </CodePanel>
    </template>

    <template #map>
      <DemoMap />
    </template>
  </ExamplePage>
</template>

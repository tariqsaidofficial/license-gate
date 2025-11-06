<script lang="ts">
	import '../app.scss'
	import MessageBar from '../lib/components/global/MessageBar.svelte'
	import ToastContainer from '../lib/components/global/ToastContainer.svelte'
</script>

<svelte:head>
	<title>LicenseGate</title>
	<!-- TODO: This should be adjusted per page for better UX -->
</svelte:head>

<div class="relative z-[60]" id="floatingCardContainer" />
<MessageBar />
<ToastContainer />
<slot />

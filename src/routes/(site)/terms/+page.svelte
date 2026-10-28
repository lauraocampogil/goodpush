<script lang="ts">
	import { PUBLIC_CONTACT_EMAIL } from '$app/env/public';
	import Legal from '../Legal.svelte';
</script>

<!-- TEMPLATE — have it reviewed before launch. -->
<Legal title="Terms of use">
	<p><em>Last updated: October 2026</em></p>
	<h2>The service</h2>
	<p>GoodPush sends one motivational phrase a day by notification. The free plan is provided “as is”; we do our best to deliver every day but can’t guarantee it.</p>
	<h2>Not professional advice</h2>
	<p>GoodPush is for encouragement only. It is not medical, psychological or professional advice. If you are going through a hard time, please reach out to a professional or someone you trust.</p>
	<h2>Premium</h2>
	<p>Premium is a monthly subscription handled by Stripe. You can cancel anytime; it stays active until the end of the paid period. EU consumers have a 14-day withdrawal right, which ends once the digital service has started with your consent.</p>
	<h2>Content</h2>
	<p>Phrases and designs belong to GoodPush. You’re welcome to share them for personal use with the GoodPush credit.</p>
	<h2>Contact</h2>
	<p><a href="mailto:{PUBLIC_CONTACT_EMAIL}">{PUBLIC_CONTACT_EMAIL}</a> · Belgian law applies.</p>
</Legal>

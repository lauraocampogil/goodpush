<script lang="ts">
	import { PUBLIC_CONTACT_EMAIL } from '$app/env/public';
	import Legal from '../Legal.svelte';
</script>

<!-- TEMPLATE — have it reviewed before launch. -->
<Legal title="Terms of use" updated="October 2026">
	<section>
		<h2>The service</h2>
		<p>GoodPush sends motivational phrases by notification. The free plan is provided “as is”; we do our best to deliver every day but can’t guarantee it.</p>
	</section>
	<section>
		<h2>Not professional advice</h2>
		<p>GoodPush is for encouragement only. It is not medical, psychological or professional advice. If you are going through a hard time, please reach out to a professional or someone you trust.</p>
	</section>
	<section>
		<h2>Premium</h2>
		<ul>
			<li>Monthly subscription, billed by Stripe. Price shown before payment, VAT included.</li>
			<li>Cancel anytime from Settings → Manage subscription. Premium stays active until the end of the paid period.</li>
			<li>EU consumers have a 14-day withdrawal right; by starting Premium immediately you agree it ends once the service has started.</li>
			<li>Premium is linked to the device where you bought it. Changing phone? Contact us and we’ll move it.</li>
		</ul>
	</section>
	<section>
		<h2>Content</h2>
		<p>Phrases and designs belong to GoodPush. You’re welcome to share them for personal use with the GoodPush credit.</p>
	</section>
	<section>
		<h2>Contact</h2>
		<p><a href="mailto:{PUBLIC_CONTACT_EMAIL}">{PUBLIC_CONTACT_EMAIL}</a> · Belgian law applies.</p>
	</section>
</Legal>

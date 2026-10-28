<script lang="ts">
	import { PUBLIC_CONTACT_EMAIL } from '$app/env/public';
	import Legal from '../Legal.svelte';
</script>

<!-- TEMPLATE — have it reviewed before launch. Fill in your company details (KBO/BCE number). -->
<Legal title="Privacy policy">
	<p><em>Last updated: October 2026</em></p>
	<p>GoodPush is run by Unix Creative Studio, Brussels, Belgium (company number: <strong>[KBO/BCE number]</strong>). Contact: <a href="mailto:{PUBLIC_CONTACT_EMAIL}">{PUBLIC_CONTACT_EMAIL}</a>.</p>

	<h2>What we collect — and why</h2>
	<ul>
		<li><strong>Your first name</strong> (optional), <strong>chosen categories, time, language and time zone</strong> — to send you the right phrase at the right time.</li>
		<li><strong>A push subscription</strong> (a technical address created by your browser) — to deliver the notification.</li>
		<li><strong>A random device ID</strong> — so your settings can be updated or deleted. No account, email or phone number.</li>
		<li><strong>Where you came from</strong> (e.g. a TikTok or Instagram link) — to understand which content works.</li>
		<li><strong>Anonymous usage events</strong> (e.g. “phrase shared”) — to improve the app. No cookies are used for this.</li>
	</ul>
	<p>Your favorites, history and streak stay on your device.</p>

	<h2>Legal basis</h2>
	<p>Your consent (GDPR art. 6.1.a), which you give when you turn on notifications. You can withdraw it at any time.</p>

	<h2>Who processes the data</h2>
	<ul>
		<li>Supabase (database, EU region) and Vercel (hosting).</li>
		<li>The push service of your browser (Apple, Google or Mozilla) delivers the notifications.</li>
		<li>PostHog (EU) for anonymous usage statistics.</li>
		<li>Stripe, only if you buy Premium.</li>
	</ul>

	<h2>How long</h2>
	<p>As long as notifications are active. Subscriptions that stop working are deactivated automatically.</p>

	<h2>Your rights</h2>
	<p>Settings → “Delete my data” deletes everything instantly. You can also email us to access, correct or delete your data, or complain to the Belgian Data Protection Authority (gegevensbeschermingsautoriteit.be / autoriteprotectiondonnees.be).</p>

	<h2>Affiliate links</h2>
	<p>Some recommendations are affiliate links: we may earn a commission if you buy, at no extra cost to you.</p>
</Legal>

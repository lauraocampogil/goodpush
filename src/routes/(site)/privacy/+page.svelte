<script lang="ts">
	import { PUBLIC_CONTACT_EMAIL } from '$app/env/public';
	import Legal from '../Legal.svelte';
</script>

<!-- TEMPLATE — have it reviewed before launch. Fill in your company number (KBO/BCE). -->
<Legal title="Privacy policy" updated="October 2026">
	<section>
		<h2>Who we are</h2>
		<p>GoodPush is run by Unix Creative Studio, Brussels, Belgium (company number: <strong>[KBO/BCE number]</strong>).</p>
		<p>Contact: <a href="mailto:{PUBLIC_CONTACT_EMAIL}">{PUBLIC_CONTACT_EMAIL}</a></p>
	</section>
	<section>
		<h2>What we collect — and why</h2>
		<ul>
			<li><strong>First name</strong> (optional), <strong>categories, time(s), language and time zone</strong> — to send the right phrase at the right time.</li>
			<li><strong>Push subscription</strong> (a technical address created by your browser) — to deliver the notification.</li>
			<li><strong>Random device ID</strong> — to update or delete your settings. No account, email or phone number.</li>
			<li><strong>Where you came from</strong> (e.g. a TikTok or Instagram link) — to understand which content works.</li>
			<li><strong>Usage events</strong> (e.g. “phrase shared”, “app installed”) — to improve the app. No cookies, nothing stored in your browser for this.</li>
			<li><strong>Error reports</strong> — technical crash details, to fix bugs.</li>
		</ul>
		<p>Favorites, history and streak stay on your device.</p>
	</section>
	<section>
		<h2>Legal basis</h2>
		<ul>
			<li>Notifications: your consent (GDPR art. 6.1.a), withdrawable anytime.</li>
			<li>Premium: performance of a contract (art. 6.1.b).</li>
			<li>Statistics and error reports: legitimate interest in running a working app (art. 6.1.f).</li>
		</ul>
	</section>
	<section>
		<h2>Who processes the data</h2>
		<ul>
			<li>Supabase (database, EU region) and Vercel (hosting).</li>
			<li>Your browser’s push service (Apple, Google or Mozilla) delivers notifications.</li>
			<li>PostHog (EU) for usage statistics · Sentry for error reports.</li>
			<li>Stripe for Premium payments — we never see your card.</li>
		</ul>
	</section>
	<section>
		<h2>How long</h2>
		<p>As long as notifications are active. Dead subscriptions are deactivated automatically. Payment records are kept as required by Belgian accounting law.</p>
	</section>
	<section>
		<h2>Your rights</h2>
		<ul>
			<li>Settings → “Delete my data” deletes everything instantly.</li>
			<li>Email us to access, correct or delete your data.</li>
			<li>You can complain to the Belgian Data Protection Authority (dataprotectionauthority.be).</li>
		</ul>
	</section>
	<section>
		<h2>Affiliate links</h2>
		<p>Some recommendations are affiliate links: we may earn a commission if you buy, at no extra cost to you.</p>
	</section>
</Legal>

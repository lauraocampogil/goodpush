import type { Lang } from '../data/categories';

/**
 * Legal pages in EN / ES / FR. TEMPLATES — have them reviewed before launch,
 * and fill in your company number once the studio is registered.
 * `{email}` is replaced with PUBLIC_CONTACT_EMAIL. Simple HTML allowed.
 */
export type LegalDoc = { title: string; updated: string; sections: { h: string; html: string }[] };

export const PRIVACY: Record<Lang, LegalDoc> = {
	en: {
		title: 'Privacy policy',
		updated: 'October 2026',
		sections: [
			{ h: 'Who we are', html: '<p>GoodPush is made by Unix Creative Studio, Brussels, Belgium (company number: <strong>[to be completed]</strong>). Contact: <a href="mailto:{email}">{email}</a></p>' },
			{
				h: 'What we collect — and why',
				html: `<ul>
<li><strong>First name</strong> (optional), <strong>categories, time(s), language and time zone</strong> — to send the right phrase at the right time.</li>
<li><strong>Push subscription</strong> (a technical address created by your browser) — to deliver the notification.</li>
<li><strong>Random device ID</strong> — to update or delete your settings.</li>
<li><strong>If you create an account</strong> (optional): your email address (and your Google identifier), your synced favorites, history and streak.</li>
<li><strong>Where you came from</strong> (e.g. a TikTok or Instagram link) — to understand which content works.</li>
<li><strong>Usage events</strong> (e.g. “phrase shared”, “app installed”) — no cookies, nothing stored in your browser for this.</li>
<li><strong>Error reports</strong> — technical crash details, to fix bugs.</li>
</ul>`
			},
			{
				h: 'Legal basis',
				html: `<ul>
<li>Notifications and marketing emails: your consent (GDPR art. 6.1.a), which you can withdraw at any time.</li>
<li>Account and Premium: performance of a contract (art. 6.1.b).</li>
<li>Statistics and error reports: legitimate interest in running a working app (art. 6.1.f).</li>
</ul>`
			},
			{
				h: 'Marketing emails',
				html: '<p>We only send marketing emails if you tick the box yourself. Every email has an unsubscribe link, and you can turn it off in your account at any time.</p>'
			},
			{
				h: 'Who processes the data',
				html: `<ul>
<li>Supabase (database and sign-in, EU region) and Vercel (hosting).</li>
<li>Your browser’s push service (Apple, Google or Mozilla) delivers the notifications.</li>
<li>PostHog (EU) for usage statistics · Sentry for error reports and feedback.</li>
<li>Brevo (EU) for marketing emails — only if you opted in.</li>
<li>Stripe for Premium payments — we never see your card.</li>
</ul>`
			},
			{ h: 'How long', html: '<p>As long as you use GoodPush. Inactive notifications are switched off automatically. Payment records are kept as required by Belgian accounting law.</p>' },
			{
				h: 'Your rights',
				html: `<ul>
<li>Settings → “Delete my data”, or Account → “Delete my account”, deletes everything instantly.</li>
<li>Email us to access, correct or delete your data.</li>
<li>You can complain to the Belgian Data Protection Authority (dataprotectionauthority.be).</li>
</ul>`
			},
			{ h: 'Affiliate links', html: '<p>Some recommendations are affiliate links: we may earn a commission if you buy, at no extra cost to you.</p>' }
		]
	},
	es: {
		title: 'Política de privacidad',
		updated: 'octubre de 2026',
		sections: [
			{ h: 'Quiénes somos', html: '<p>GoodPush es un proyecto de Unix Creative Studio, Bruselas, Bélgica (número de empresa: <strong>[por completar]</strong>). Contacto: <a href="mailto:{email}">{email}</a></p>' },
			{
				h: 'Qué datos recogemos y por qué',
				html: `<ul>
<li><strong>Nombre</strong> (opcional), <strong>categorías, hora(s), idioma y zona horaria</strong>: para enviarte la frase adecuada a la hora adecuada.</li>
<li><strong>Suscripción push</strong> (una dirección técnica creada por tu navegador): para entregar la notificación.</li>
<li><strong>Identificador aleatorio del dispositivo</strong>: para actualizar o borrar tus ajustes.</li>
<li><strong>Si creas una cuenta</strong> (opcional): tu email (y tu identificador de Google), tus favoritas, historial y racha sincronizados.</li>
<li><strong>De dónde vienes</strong> (por ejemplo, un enlace de TikTok o Instagram): para saber qué contenido funciona.</li>
<li><strong>Eventos de uso</strong> (por ejemplo, “frase compartida”, “app instalada”): sin cookies y sin guardar nada en tu navegador para esto.</li>
<li><strong>Informes de errores</strong>: detalles técnicos para corregir fallos.</li>
</ul>`
			},
			{
				h: 'Base legal',
				html: `<ul>
<li>Notificaciones y emails de marketing: tu consentimiento (art. 6.1.a RGPD), que puedes retirar cuando quieras.</li>
<li>Cuenta y Premium: ejecución de un contrato (art. 6.1.b).</li>
<li>Estadísticas e informes de errores: interés legítimo en que la app funcione (art. 6.1.f).</li>
</ul>`
			},
			{ h: 'Emails de marketing', html: '<p>Solo enviamos emails de marketing si marcas tú la casilla. Cada email incluye un enlace para darte de baja, y puedes desactivarlo en tu cuenta en cualquier momento.</p>' },
			{
				h: 'Quién trata los datos',
				html: `<ul>
<li>Supabase (base de datos e inicio de sesión, región UE) y Vercel (alojamiento).</li>
<li>El servicio push de tu navegador (Apple, Google o Mozilla) entrega las notificaciones.</li>
<li>PostHog (UE) para estadísticas · Sentry para informes de errores y opiniones.</li>
<li>Brevo (UE) para los emails de marketing, solo si aceptaste recibirlos.</li>
<li>Stripe para los pagos Premium: nunca vemos tu tarjeta.</li>
</ul>`
			},
			{ h: 'Durante cuánto tiempo', html: '<p>Mientras uses GoodPush. Las notificaciones inactivas se desactivan automáticamente. Los datos de pago se conservan según exige la ley contable belga.</p>' },
			{
				h: 'Tus derechos',
				html: `<ul>
<li>Ajustes → “Borrar mis datos”, o Cuenta → “Borrar mi cuenta”, lo elimina todo al instante.</li>
<li>Escríbenos para acceder, corregir o borrar tus datos.</li>
<li>Puedes presentar una reclamación ante la Autoridad belga de Protección de Datos (autoriteprotectiondonnees.be).</li>
</ul>`
			},
			{ h: 'Enlaces de afiliado', html: '<p>Algunas recomendaciones son enlaces de afiliado: podemos ganar una comisión si compras, sin coste extra para ti.</p>' }
		]
	},
	fr: {
		title: 'Politique de confidentialité',
		updated: 'octobre 2026',
		sections: [
			{ h: 'Qui sommes-nous', html: '<p>GoodPush est conçu par Unix Creative Studio, Bruxelles, Belgique (numéro d’entreprise : <strong>[à compléter]</strong>). Contact : <a href="mailto:{email}">{email}</a></p>' },
			{
				h: 'Ce que nous collectons — et pourquoi',
				html: `<ul>
<li><strong>Prénom</strong> (optionnel), <strong>catégories, heure(s), langue et fuseau horaire</strong> — pour t’envoyer la bonne phrase au bon moment.</li>
<li><strong>Abonnement push</strong> (une adresse technique créée par ton navigateur) — pour livrer la notification.</li>
<li><strong>Identifiant aléatoire de l’appareil</strong> — pour modifier ou supprimer tes réglages.</li>
<li><strong>Si tu crées un compte</strong> (optionnel) : ton email (et ton identifiant Google), tes favoris, ton historique et ta série synchronisés.</li>
<li><strong>D’où tu viens</strong> (par ex. un lien TikTok ou Instagram) — pour savoir quel contenu fonctionne.</li>
<li><strong>Événements d’usage</strong> (par ex. « phrase partagée », « app installée ») — sans cookies, rien n’est stocké dans ton navigateur pour cela.</li>
<li><strong>Rapports d’erreurs</strong> — détails techniques pour corriger les bugs.</li>
</ul>`
			},
			{
				h: 'Base légale',
				html: `<ul>
<li>Notifications et emails marketing : ton consentement (art. 6.1.a RGPD), retirable à tout moment.</li>
<li>Compte et Premium : exécution d’un contrat (art. 6.1.b).</li>
<li>Statistiques et rapports d’erreurs : intérêt légitime à faire fonctionner l’app (art. 6.1.f).</li>
</ul>`
			},
			{ h: 'Emails marketing', html: '<p>Nous n’envoyons d’emails marketing que si tu coches toi-même la case. Chaque email contient un lien de désinscription, et tu peux le désactiver dans ton compte à tout moment.</p>' },
			{
				h: 'Qui traite les données',
				html: `<ul>
<li>Supabase (base de données et connexion, région UE) et Vercel (hébergement).</li>
<li>Le service push de ton navigateur (Apple, Google ou Mozilla) livre les notifications.</li>
<li>PostHog (UE) pour les statistiques · Sentry pour les rapports d’erreurs et les avis.</li>
<li>Brevo (UE) pour les emails marketing — uniquement si tu as accepté.</li>
<li>Stripe pour les paiements Premium — nous ne voyons jamais ta carte.</li>
</ul>`
			},
			{ h: 'Combien de temps', html: '<p>Tant que tu utilises GoodPush. Les notifications inactives sont désactivées automatiquement. Les données de paiement sont conservées selon la loi comptable belge.</p>' },
			{
				h: 'Tes droits',
				html: `<ul>
<li>Réglages → « Supprimer mes données », ou Compte → « Supprimer mon compte », efface tout immédiatement.</li>
<li>Écris-nous pour accéder à tes données, les corriger ou les supprimer.</li>
<li>Tu peux introduire une plainte auprès de l’Autorité de protection des données (autoriteprotectiondonnees.be).</li>
</ul>`
			},
			{ h: 'Liens affiliés', html: '<p>Certaines recommandations sont des liens affiliés : nous pouvons toucher une commission si tu achètes, sans surcoût pour toi.</p>' }
		]
	}
};

export const TERMS: Record<Lang, LegalDoc> = {
	en: {
		title: 'Terms of use',
		updated: 'October 2026',
		sections: [
			{ h: 'The service', html: '<p>GoodPush sends motivational phrases by notification. The free plan is provided “as is”: we do our best to deliver every day but can’t guarantee it.</p>' },
			{ h: 'Not professional advice', html: '<p>GoodPush is for encouragement only. It is not medical, psychological or professional advice. If you are going through a hard time, please reach out to a professional or someone you trust.</p>' },
			{ h: 'Account', html: '<p>An account is optional. You are responsible for access to your email or Google account. You can delete your account at any time.</p>' },
			{
				h: 'Premium',
				html: `<ul>
<li>Monthly subscription billed by Stripe. Price shown before payment, VAT included.</li>
<li>Cancel anytime from Settings → Manage subscription. Premium stays active until the end of the paid period.</li>
<li>EU consumers have a 14-day withdrawal right; by starting Premium immediately you agree it ends once the service has started.</li>
<li>Bought without an account? Premium is linked to that phone — sign in to use it everywhere.</li>
</ul>`
			},
			{ h: 'Content', html: '<p>Phrases and designs belong to GoodPush. You’re welcome to share them for personal use with the GoodPush credit.</p>' },
			{ h: 'Contact', html: '<p><a href="mailto:{email}">{email}</a> · Belgian law applies.</p>' }
		]
	},
	es: {
		title: 'Condiciones de uso',
		updated: 'octubre de 2026',
		sections: [
			{ h: 'El servicio', html: '<p>GoodPush envía frases motivacionales por notificación. El plan gratuito se ofrece “tal cual”: hacemos lo posible por enviarlas cada día, pero no podemos garantizarlo.</p>' },
			{ h: 'No es consejo profesional', html: '<p>GoodPush es solo para animarte. No es un consejo médico, psicológico ni profesional. Si estás pasando por un momento difícil, habla con un profesional o con alguien de confianza.</p>' },
			{ h: 'Cuenta', html: '<p>La cuenta es opcional. Eres responsable del acceso a tu email o a tu cuenta de Google. Puedes borrar tu cuenta cuando quieras.</p>' },
			{
				h: 'Premium',
				html: `<ul>
<li>Suscripción mensual cobrada por Stripe. El precio se muestra antes de pagar, IVA incluido.</li>
<li>Cancela cuando quieras en Ajustes → Gestionar suscripción. Premium sigue activo hasta el final del periodo pagado.</li>
<li>Los consumidores de la UE tienen 14 días de desistimiento; al empezar Premium de inmediato, aceptas que termina cuando el servicio ha comenzado.</li>
<li>¿Lo compraste sin cuenta? Premium queda ligado a ese móvil: inicia sesión para usarlo en todos.</li>
</ul>`
			},
			{ h: 'Contenido', html: '<p>Las frases y los diseños pertenecen a GoodPush. Puedes compartirlos para uso personal mencionando GoodPush.</p>' },
			{ h: 'Contacto', html: '<p><a href="mailto:{email}">{email}</a> · Se aplica la ley belga.</p>' }
		]
	},
	fr: {
		title: 'Conditions d’utilisation',
		updated: 'octobre 2026',
		sections: [
			{ h: 'Le service', html: '<p>GoodPush envoie des phrases motivantes par notification. Le plan gratuit est fourni « tel quel » : on fait de notre mieux pour l’envoyer chaque jour, sans pouvoir le garantir.</p>' },
			{ h: 'Pas un conseil professionnel', html: '<p>GoodPush sert uniquement à encourager. Ce n’est pas un conseil médical, psychologique ou professionnel. Si tu traverses une période difficile, parle à un professionnel ou à une personne de confiance.</p>' },
			{ h: 'Compte', html: '<p>Le compte est optionnel. Tu es responsable de l’accès à ton email ou à ton compte Google. Tu peux supprimer ton compte à tout moment.</p>' },
			{
				h: 'Premium',
				html: `<ul>
<li>Abonnement mensuel facturé par Stripe. Prix affiché avant paiement, TVA incluse.</li>
<li>Résiliable à tout moment via Réglages → Gérer l’abonnement. Premium reste actif jusqu’à la fin de la période payée.</li>
<li>Les consommateurs de l’UE ont 14 jours de rétractation ; en démarrant Premium immédiatement, tu acceptes qu’il prenne fin dès le début du service.</li>
<li>Acheté sans compte ? Premium est lié à ce téléphone — connecte-toi pour l’utiliser partout.</li>
</ul>`
			},
			{ h: 'Contenu', html: '<p>Les phrases et les designs appartiennent à GoodPush. Tu peux les partager pour un usage personnel en citant GoodPush.</p>' },
			{ h: 'Contact', html: '<p><a href="mailto:{email}">{email}</a> · Le droit belge s’applique.</p>' }
		]
	}
};

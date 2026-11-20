// The motivational part of the quote videos (formats S and Q), @processlaw style:
//   intro (who said it, without the name — the name only goes in the caption) → the real quote → what it means
//   for YOU today → a short order to move. The quote stays word for word (quotes.mjs); everything here is ours.
const INTRO = {
	ma: {
		en: ['Two thousand years ago, the most powerful man on Earth wrote this in his private diary.', 'A Roman emperor wrote this to himself. Nobody was supposed to read it.', 'This was written by an emperor, at war, alone, at night.'],
		es: ['Hace dos mil años, el hombre más poderoso del mundo escribió esto en su diario privado.', 'Un emperador romano se escribió esto a sí mismo. Nadie debía leerlo.', 'Esto lo escribió un emperador, en plena guerra, solo, de noche.']
	},
	se: {
		en: ['A man who lived two thousand years ago left you this message.', 'Two thousand years ago, someone wrote a letter. Today it is for you.', 'This was written in a letter, two thousand years ago. It still hits.'],
		es: ['Un hombre que vivió hace dos mil años te dejó este mensaje.', 'Hace dos mil años, alguien escribió una carta. Hoy es para ti.', 'Esto se escribió en una carta hace dos mil años. Y sigue doliendo.']
	}
};

export const PUSH = {
	'ma-10-16': {
		en: ['Stop watching videos about discipline. Stop saving quotes you never use.', 'You already know what you have to do.', 'The gap between who you are and who you want to be is not information. It is action.', 'So close this app. And be that person. Today.'],
		es: ['Deja de ver vídeos sobre disciplina. Deja de guardar frases que nunca usas.', 'Ya sabes lo que tienes que hacer.', 'Lo que te separa de quien quieres ser no es información. Es acción.', 'Así que cierra esta app. Y sé esa persona. Hoy.']
	},
	'ma-12-17': {
		en: ['Simple. But almost nobody lives like this.', 'Every lie you tell, every shortcut you take, you pay for it later.', 'Live clean. Sleep in peace. Walk with your head up.', 'That is real strength.'],
		es: ['Simple. Pero casi nadie vive así.', 'Cada mentira que dices, cada atajo que tomas, lo pagas después.', 'Vive limpio. Duerme en paz. Camina con la cabeza alta.', 'Esa es la verdadera fuerza.']
	},
	'ma-7-67': {
		en: ['He had everything. Gold. Armies. An empire.', 'And he still wrote that you need almost nothing.', 'You are not one purchase away from being happy. You are one decision away.', 'Stop chasing more. Start living what you already have.'],
		es: ['Lo tenía todo. Oro. Ejércitos. Un imperio.', 'Y aun así escribió que no necesitas casi nada.', 'No estás a una compra de ser feliz. Estás a una decisión.', 'Deja de perseguir más. Empieza a vivir lo que ya tienes.']
	},
	'ma-6-6': {
		en: ['Someone hurt you. You want them to pay.', 'But the moment you become cruel, they win twice.', 'Don’t let anyone turn you into someone you are not.', 'Your peace is your revenge. Protect it.'],
		es: ['Alguien te hizo daño. Quieres que lo pague.', 'Pero en el momento en que te vuelves cruel, ganan dos veces.', 'No dejes que nadie te convierta en alguien que no eres.', 'Tu paz es tu venganza. Protégela.']
	},
	'ma-5-20': {
		en: ['Read that again.', 'The thing blocking you is not the end of the road. It is the road.', 'Every rejection, every failure, every no, is training you for what is coming.', 'Stop asking why this is happening to you. Ask what it is teaching you. And keep walking.'],
		es: ['Léelo otra vez.', 'Lo que te bloquea no es el final del camino. Es el camino.', 'Cada rechazo, cada fracaso, cada no, te está entrenando para lo que viene.', 'Deja de preguntar por qué te pasa esto. Pregunta qué te está enseñando. Y sigue caminando.']
	},
	'ma-8-47': {
		en: ['It is not the situation that breaks you. It is the story you tell yourself about it.', 'Change the story, and you change everything.', 'You cannot control what happens. You can always control what you do next.', 'So breathe. Decide. Move.'],
		es: ['No es la situación lo que te rompe. Es la historia que te cuentas sobre ella.', 'Cambia la historia, y lo cambias todo.', 'No controlas lo que pasa. Siempre controlas lo que haces después.', 'Así que respira. Decide. Muévete.']
	},
	'ma-2-5': {
		en: ['Not to scare you. To wake you up.', 'You keep saying tomorrow like tomorrow is promised.', 'Call the person you miss. Start the thing you keep postponing. Say what you really feel.', 'Live today like it counts. Because it does.'],
		es: ['No para asustarte. Para despertarte.', 'Sigues diciendo mañana como si el mañana estuviera garantizado.', 'Llama a quien echas de menos. Empieza lo que sigues aplazando. Di lo que de verdad sientes.', 'Vive hoy como si contara. Porque cuenta.']
	},
	'ma-5-1': {
		en: ['Even an emperor did not want to get out of bed.', 'Motivation is not coming. It never comes first.', 'You get up because you have work to do. Because someone is counting on you. Because you made yourself a promise.', 'So get up. Now.'],
		es: ['Ni siquiera un emperador quería salir de la cama.', 'La motivación no va a llegar. Nunca llega primero.', 'Te levantas porque tienes trabajo que hacer. Porque alguien cuenta contigo. Porque te hiciste una promesa.', 'Así que levántate. Ahora.']
	},
	'ma-8-16': {
		en: ['Admitting you were wrong is not weakness. It is the fastest way to grow.', 'Your ego wants to be right. Your future wants you to get better.', 'Listen to the people who correct you. They are giving you years for free.', 'Be humble. And unstoppable.'],
		es: ['Admitir que te equivocaste no es debilidad. Es la forma más rápida de crecer.', 'Tu ego quiere tener razón. Tu futuro quiere que mejores.', 'Escucha a quien te corrige. Te está regalando años.', 'Sé humilde. E imparable.']
	},
	'ma-4-3b': {
		en: ['You don’t need a vacation to find peace. You don’t need everyone to understand you.', 'Close your eyes. Breathe. Come back to yourself.', 'The world can be loud. Inside you, it can be quiet.', 'Find that place. And go back there every day.'],
		es: ['No necesitas unas vacaciones para encontrar paz. No necesitas que todos te entiendan.', 'Cierra los ojos. Respira. Vuelve a ti.', 'El mundo puede hacer ruido. Dentro de ti puede haber silencio.', 'Encuentra ese lugar. Y vuelve a él cada día.']
	},
	'ma-3-5': {
		en: ['Nobody is coming to save you. No one is going to carry you.', 'And that is the best news you will hear today.', 'Because it means everything you build, you built. Every step you take, is yours.', 'Stand up. On your own two feet.'],
		es: ['Nadie va a venir a salvarte. Nadie te va a llevar en brazos.', 'Y es la mejor noticia que vas a escuchar hoy.', 'Porque significa que todo lo que construyas, lo construiste tú. Cada paso que des, es tuyo.', 'Levántate. Sobre tus propios pies.']
	},
	'se-13': {
		en: ['Think about it. How many things did you fear that never happened?', 'Your mind plays the worst movie, again and again, at three in the morning.', 'But reality is almost always kinder than your fear.', 'Stop suffering for things that haven’t happened. Live the day in front of you.'],
		es: ['Piénsalo. ¿Cuántas cosas temiste que nunca pasaron?', 'Tu mente pone la peor película, una y otra vez, a las tres de la mañana.', 'Pero la realidad casi siempre es más amable que tu miedo.', 'Deja de sufrir por cosas que no han pasado. Vive el día que tienes delante.']
	},
	'se-101': {
		en: ['Not one day. One whole life.', 'Wake up. Fight. Love. Learn. Rest.', 'And if it was the last, you would have lived it fully.', 'Stop waiting for your life to start. This is it. Begin.'],
		es: ['No un día. Una vida entera.', 'Despierta. Lucha. Ama. Aprende. Descansa.', 'Y si fuera el último, lo habrías vivido de verdad.', 'Deja de esperar a que tu vida empiece. Es esta. Empieza.']
	},
	'se-1': {
		en: ['Two thousand years later, we still say later.', 'Later I will train. Later I will study. Later I will call.', 'And later becomes never.', 'Do one thing today. Just one. Right now.'],
		es: ['Dos mil años después, seguimos diciendo luego.', 'Luego entreno. Luego estudio. Luego llamo.', 'Y luego se convierte en nunca.', 'Haz una cosa hoy. Solo una. Ahora mismo.']
	},
	'se-71': {
		en: ['You feel lost because you never chose a direction.', 'You don’t need the whole map. You need one destination.', 'Pick it. Write it down. Say it out loud.', 'Then every wind starts pushing you there.'],
		es: ['Te sientes perdido porque nunca elegiste una dirección.', 'No necesitas el mapa entero. Necesitas un destino.', 'Elígelo. Escríbelo. Dilo en voz alta.', 'Y entonces todos los vientos empiezan a empujarte hacia allí.']
	},
	'se-2': {
		en: ['Ten goals at once is zero goals.', 'Ten projects at once is zero finished.', 'Choose one thing. Give it everything you have.', 'Focus is the rarest superpower. Use it.'],
		es: ['Diez metas a la vez son cero metas.', 'Diez proyectos a la vez son cero terminados.', 'Elige una cosa. Dale todo lo que tienes.', 'La concentración es el superpoder más raro. Úsalo.']
	},
	'se-28': {
		en: ['Wherever you are from. Wherever you are now.', 'You are not too far. You are not too late. You are not too small.', 'The whole world is open to you.', 'Go take your place in it.'],
		es: ['Vengas de donde vengas. Estés donde estés.', 'No estás demasiado lejos. No es demasiado tarde. No eres demasiado pequeño.', 'El mundo entero está abierto para ti.', 'Ve a ocupar tu lugar.']
	}
};

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
/** Spoken lines for a quote video: intro → the quote (its own sentences) → the push. */
export function quoteScript(q, lang, quoteSentences, seed = q.id) {
	const kind = q.id.startsWith('se') ? 'se' : 'ma';
	const intros = INTRO[kind][lang] ?? INTRO[kind].en;
	const push = PUSH[q.id]?.[lang] ?? PUSH[q.id]?.en ?? [];
	return [intros[hash(seed) % intros.length], ...quoteSentences, ...push];
}

import type { CategoryId, Lang } from './categories';

/**
 * The phrase library. Wrap ONE key word in *asterisks* — it gets the pink tape.
 * Add as many as you want: each category rotates through its list day by day.
 * Keep the same `id` forever (favorites are stored by id).
 */
/** `premium: true` → only sent / shown to Premium members. */
export type Phrase = { id: string; cat: CategoryId; premium?: boolean } & Record<Lang, string>;

export const PHRASES: Phrase[] = [
	// ---------- DISCIPLINE ----------
	{ id: 'd1', cat: 'discipline', en: 'Do it even when you *don’t feel like it*.', es: 'Hazlo aunque *no tengas ganas*.', fr: 'Fais-le même *sans en avoir envie*.' },
	{ id: 'd2', cat: 'discipline', en: 'Motivation fades. *Habits* stay.', es: 'La motivación se va. Los *hábitos* se quedan.', fr: 'La motivation passe. Les *habitudes* restent.' },
	{ id: 'd3', cat: 'discipline', en: 'Today is *not* up for negotiation.', es: 'Hoy *no* se negocia.', fr: 'Aujourd’hui, ça *ne* se négocie pas.' },
	{ id: 'd4', cat: 'discipline', en: 'Small steps. *Every* single day.', es: 'Pasos pequeños. *Todos* los días.', fr: 'Des petits pas. *Chaque* jour.' },
	{ id: 'd5', cat: 'discipline', en: 'The version of you that wins *starts now*.', es: 'La versión de ti que gana *empieza ahora*.', fr: 'La version de toi qui gagne *commence maintenant*.' },
	{ id: 'd6', cat: 'discipline', en: 'Stop waiting. *Start* messy.', es: 'Deja de esperar. *Empieza* aunque sea imperfecto.', fr: 'Arrête d’attendre. *Commence*, même imparfait.' },
	{ id: 'd7', cat: 'discipline', en: 'Nobody is coming to *save* you. Good. You’ve got this.', es: 'Nadie va a venir a *salvarte*. Bien. Tú puedes.', fr: 'Personne ne viendra te *sauver*. Tant mieux. Tu gères.' },
	{ id: 'd8', cat: 'discipline', en: 'Finish what you *started*.', es: 'Termina lo que *empezaste*.', fr: 'Termine ce que tu as *commencé*.' },

	// ---------- CALM ----------
	{ id: 'c1', cat: 'calm', en: 'Breathe. Everything arrives *in its time*.', es: 'Respira. Todo llega *a su tiempo*.', fr: 'Respire. Tout arrive *en son temps*.' },
	{ id: 'c2', cat: 'calm', en: 'You don’t have to solve *everything* today.', es: 'No tienes que resolver *todo* hoy.', fr: 'Tu n’as pas à tout *régler* aujourd’hui.' },
	{ id: 'c3', cat: 'calm', en: 'Slow is *still* moving forward.', es: 'Despacio *también* es avanzar.', fr: 'Lentement, c’est *quand même* avancer.' },
	{ id: 'c4', cat: 'calm', en: 'This feeling is a *visitor*, not your home.', es: 'Esta sensación es una *visita*, no tu casa.', fr: 'Ce sentiment est un *visiteur*, pas ta maison.' },
	{ id: 'c5', cat: 'calm', en: 'Rest is part of the *plan*.', es: 'Descansar también es parte del *plan*.', fr: 'Le repos fait partie du *plan*.' },
	{ id: 'c6', cat: 'calm', en: 'One thing at a time. *Just one*.', es: 'Una cosa a la vez. *Solo una*.', fr: 'Une chose à la fois. *Juste une*.' },
	{ id: 'c7', cat: 'calm', en: 'You are *safe* right now.', es: 'Ahora mismo estás *a salvo*.', fr: 'Là, maintenant, tu es *en sécurité*.' },
	{ id: 'c8', cat: 'calm', en: 'Let today be *light*.', es: 'Deja que hoy sea *ligero*.', fr: 'Laisse aujourd’hui être *léger*.' },

	// ---------- SPORT ----------
	{ id: 's1', cat: 'sport', en: 'One more rep than *yesterday*.', es: 'Una repetición más que *ayer*.', fr: 'Une répétition de plus qu’*hier*.' },
	{ id: 's2', cat: 'sport', en: 'Sweat now. *Shine* later.', es: 'Suda ahora. *Brilla* después.', fr: 'Transpire maintenant. *Brille* plus tard.' },
	{ id: 's3', cat: 'sport', en: 'The body does it. The *mind* decides.', es: 'El cuerpo lo hace. La *mente* decide.', fr: 'Le corps exécute. Le *mental* décide.' },
	{ id: 's4', cat: 'sport', en: 'Train like nobody *believes* in you.', es: 'Entrena como si nadie *creyera* en ti.', fr: 'Entraîne-toi comme si personne n’y *croyait*.' },
	{ id: 's5', cat: 'sport', en: 'Bad session? Still a *session*.', es: '¿Mal entreno? Sigue siendo un *entreno*.', fr: 'Mauvaise séance ? Ça reste une *séance*.' },
	{ id: 's6', cat: 'sport', en: 'Champions are built on *boring* days.', es: 'Los campeones se hacen en los días *aburridos*.', fr: 'Les champions se font les jours *ennuyeux*.' },
	{ id: 's7', cat: 'sport', en: 'Lace up. The rest *follows*.', es: 'Átate las zapatillas. Lo demás *viene solo*.', fr: 'Lace tes chaussures. Le reste *suit*.' },
	{ id: 's8', cat: 'sport', en: 'Tired is temporary. *Proud* is forever.', es: 'El cansancio pasa. El *orgullo* queda.', fr: 'La fatigue passe. La *fierté* reste.' },

	// ---------- STUDY ----------
	{ id: 't1', cat: 'study', en: 'One page. Then *another*.', es: 'Una página. Luego *otra*.', fr: 'Une page. Puis *une autre*.' },
	{ id: 't2', cat: 'study', en: 'Phone away. *Focus* on.', es: 'Móvil lejos. *Foco* encendido.', fr: 'Téléphone loin. *Focus* allumé.' },
	{ id: 't3', cat: 'study', en: 'Future you says *thank you*.', es: 'Tu yo del futuro te dice *gracias*.', fr: 'Ton toi du futur te dit *merci*.' },
	{ id: 't4', cat: 'study', en: '25 minutes. You can do *25 minutes*.', es: '25 minutos. Puedes con *25 minutos*.', fr: '25 minutes. Tu peux faire *25 minutes*.' },
	{ id: 't5', cat: 'study', en: 'Confused means you’re *learning*.', es: 'Estar confundida significa que estás *aprendiendo*.', fr: 'Être perdu, c’est être en train d’*apprendre*.' },
	{ id: 't6', cat: 'study', en: 'Done is better than *perfect*.', es: 'Hecho es mejor que *perfecto*.', fr: 'Fait vaut mieux que *parfait*.' },
	{ id: 't7', cat: 'study', en: 'Your effort *counts*, even when nobody sees it.', es: 'Tu esfuerzo *cuenta*, aunque nadie lo vea.', fr: 'Ton effort *compte*, même si personne ne le voit.' },
	{ id: 't8', cat: 'study', en: 'Start with the *hardest* one.', es: 'Empieza por lo más *difícil*.', fr: 'Commence par le plus *dur*.' },

	// ---------- BUILD (hustle / entrepreneurship) ----------
	{ id: 'b1', cat: 'build', en: 'Build in *silence*.', es: 'Construye en *silencio*.', fr: 'Construis en *silence*.' },
	{ id: 'b2', cat: 'build', en: 'Ship it. Then make it *better*.', es: 'Lánzalo. Luego hazlo *mejor*.', fr: 'Lance-le. Puis rends-le *meilleur*.' },
	{ id: 'b3', cat: 'build', en: 'Every “no” is *data*.', es: 'Cada “no” es *información*.', fr: 'Chaque « non » est une *info*.' },
	{ id: 'b4', cat: 'build', en: 'Your idea deserves a *chance*.', es: 'Tu idea merece una *oportunidad*.', fr: 'Ton idée mérite sa *chance*.' },
	{ id: 'b5', cat: 'build', en: 'Talk to *one* customer today.', es: 'Habla hoy con *un* cliente.', fr: 'Parle à *un* client aujourd’hui.' },
	{ id: 'b6', cat: 'build', en: 'Consistency beats *talent* that quits.', es: 'La constancia gana al *talento* que se rinde.', fr: 'La régularité bat le *talent* qui abandonne.' },
	{ id: 'b7', cat: 'build', en: 'Nobody knows what they’re doing. *Start* anyway.', es: 'Nadie sabe lo que hace. *Empieza* igual.', fr: 'Personne ne sait vraiment. *Commence* quand même.' },
	{ id: 'b8', cat: 'build', en: 'Bet on *yourself*.', es: 'Apuesta por *ti*.', fr: 'Parie sur *toi*.' },

	// ---------- FAITH ----------
	{ id: 'f1', cat: 'faith', en: 'You are not alone. You *never* were.', es: 'No estás sola. *Nunca* lo estuviste.', fr: 'Tu n’es pas seul. Tu ne l’as *jamais* été.' },
	{ id: 'f2', cat: 'faith', en: 'Trust the *timing*.', es: 'Confía en los *tiempos*.', fr: 'Fais confiance au *timing*.' },
	{ id: 'f3', cat: 'faith', en: 'What is meant for you will *find* you.', es: 'Lo que es para ti te va a *encontrar*.', fr: 'Ce qui t’est destiné te *trouvera*.' },
	{ id: 'f4', cat: 'faith', en: 'Pray. Then *move*.', es: 'Reza. Y luego *muévete*.', fr: 'Prie. Puis *avance*.' },
	{ id: 'f5', cat: 'faith', en: 'Gratitude turns enough into *plenty*.', es: 'La gratitud convierte lo suficiente en *abundancia*.', fr: 'La gratitude change l’assez en *abondance*.' },
	{ id: 'f6', cat: 'faith', en: 'Hope is a *decision*.', es: 'La esperanza es una *decisión*.', fr: 'L’espoir est une *décision*.' },
	{ id: 'f7', cat: 'faith', en: 'You are carried *today* too.', es: 'Hoy *también* te sostienen.', fr: 'Aujourd’hui *aussi*, tu es porté.' },
	{ id: 'f8', cat: 'faith', en: 'Peace first. *Answers* later.', es: 'Primero la paz. Las *respuestas* después.', fr: 'La paix d’abord. Les *réponses* après.' },

	// ---------- SELF-LOVE ----------
	{ id: 'l1', cat: 'selflove', en: 'You are *enough*. Today too.', es: 'Eres *suficiente*. Hoy también.', fr: 'Tu es *assez*. Aujourd’hui aussi.' },
	{ id: 'l2', cat: 'selflove', en: 'Talk to yourself like someone you *love*.', es: 'Háblate como a alguien que *quieres*.', fr: 'Parle-toi comme à quelqu’un que tu *aimes*.' },
	{ id: 'l3', cat: 'selflove', en: 'Your pace is *your* pace.', es: 'Tu ritmo es *tu* ritmo.', fr: 'Ton rythme est *ton* rythme.' },
	{ id: 'l4', cat: 'selflove', en: 'Be proud of how far you’ve *come*.', es: 'Siéntete orgullosa de todo lo que has *avanzado*.', fr: 'Sois fier du chemin *parcouru*.' },
	{ id: 'l5', cat: 'selflove', en: 'You don’t need to *earn* rest.', es: 'No tienes que *ganarte* el descanso.', fr: 'Tu n’as pas à *mériter* le repos.' },
	{ id: 'l6', cat: 'selflove', en: 'Mistakes don’t cancel your *worth*.', es: 'Los errores no cancelan tu *valor*.', fr: 'Les erreurs n’annulent pas ta *valeur*.' },
	{ id: 'l7', cat: 'selflove', en: 'Choose *you*. Without guilt.', es: 'Elígete a *ti*. Sin culpa.', fr: 'Choisis-*toi*. Sans culpabilité.' },
	{ id: 'l8', cat: 'selflove', en: 'You’re doing *better* than you think.', es: 'Lo estás haciendo *mejor* de lo que crees.', fr: 'Tu fais *mieux* que tu ne le penses.' },
	// ---------- PREMIUM DROPS (Premium only) ----------
	{ id: 'pd1', cat: 'discipline', premium: true, en: 'Win the morning. *Win* the day.', es: 'Gana la mañana. *Gana* el día.', fr: 'Gagne le matin. *Gagne* la journée.' },
	{ id: 'pd2', cat: 'discipline', premium: true, en: 'Discipline is self-*respect*.', es: 'La disciplina es *respeto* propio.', fr: 'La discipline, c’est du *respect* pour soi.' },
	{ id: 'pc1', cat: 'calm', premium: true, en: 'Unclench your jaw. *Drop* your shoulders.', es: 'Suelta la mandíbula. *Baja* los hombros.', fr: 'Desserre la mâchoire. *Baisse* les épaules.' },
	{ id: 'pc2', cat: 'calm', premium: true, en: 'Not every thought deserves an *answer*.', es: 'No todo pensamiento merece una *respuesta*.', fr: 'Toutes les pensées ne méritent pas une *réponse*.' },
	{ id: 'ps1', cat: 'sport', premium: true, en: 'Your rival is *yesterday’s* you.', es: 'Tu rival es tu yo de *ayer*.', fr: 'Ton rival, c’est toi d’*hier*.' },
	{ id: 'ps2', cat: 'sport', premium: true, en: 'Pressure is a *privilege*.', es: 'La presión es un *privilegio*.', fr: 'La pression est un *privilège*.' },
	{ id: 'pt1', cat: 'study', premium: true, en: 'Learn it like you’ll *teach* it.', es: 'Apréndelo como si fueras a *enseñarlo*.', fr: 'Apprends-le comme si tu devais l’*enseigner*.' },
	{ id: 'pt2', cat: 'study', premium: true, en: 'Today’s effort is tomorrow’s *ease*.', es: 'El esfuerzo de hoy es la *calma* de mañana.', fr: 'L’effort d’aujourd’hui, c’est la *facilité* de demain.' },
	{ id: 'pb1', cat: 'build', premium: true, en: 'Charge what you’re *worth*.', es: 'Cobra lo que *vales*.', fr: 'Facture ce que tu *vaux*.' },
	{ id: 'pb2', cat: 'build', premium: true, en: 'Ideas are cheap. *Execution* isn’t.', es: 'Las ideas son baratas. La *ejecución* no.', fr: 'Les idées sont gratuites. L’*exécution*, non.' },
	{ id: 'pf1', cat: 'faith', premium: true, en: 'Grace for *today*. That’s enough.', es: 'Gracia para *hoy*. Con eso basta.', fr: 'De la grâce pour *aujourd’hui*. Ça suffit.' },
	{ id: 'pf2', cat: 'faith', premium: true, en: 'Your story isn’t *over*.', es: 'Tu historia no ha *terminado*.', fr: 'Ton histoire n’est pas *finie*.' },
	{ id: 'pl1', cat: 'selflove', premium: true, en: 'Softness is *strength* too.', es: 'La suavidad también es *fuerza*.', fr: 'La douceur aussi, c’est de la *force*.' },
	{ id: 'pl2', cat: 'selflove', premium: true, en: 'You’re allowed to *outgrow* things.', es: 'Tienes derecho a *dejar atrás* cosas.', fr: 'Tu as le droit de *dépasser* certaines choses.' }
];

export const PHRASE_BY_ID = new Map(PHRASES.map((p) => [p.id, p]));

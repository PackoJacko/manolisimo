'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{
    0: { transcript: string };
    isFinal: boolean;
  }>;
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type IdeaStatus = 'Pendiente' | 'Favorita' | 'Dibujando' | 'Hecha';

type Idea = {
  id: number;
  title: string;
  raw: string;
  summary: string;
  why: string;
  illustration: string;
  productText: string;
  category: string;
  status: IdeaStatus;
  author: string;
  createdAt: string;
};

type DatabaseIdea = {
  id: number;
  title: string;
  raw: string;
  summary: string;
  why: string;
  illustration: string;
  product_text: string;
  category: string;
  status: IdeaStatus;
  author: string;
  created_at: string;
};

const databaseUrl = 'https://vlajqijjekgmwwajugfl.supabase.co/rest/v1/ideas';
const databaseKey = 'sb_publishable_rLOoqZ7G1wwLzG32tTZhtw_0mbOJWbL';

const databaseHeaders = {
  apikey: databaseKey,
  'Content-Type': 'application/json',
};

const statuses: IdeaStatus[] = ['Pendiente', 'Favorita', 'Dibujando', 'Hecha'];

const examples: Idea[] = [
  {
    id: 1,
    title: 'San USB Bendito',
    raw: 'Un santo patrón de los cargadores rotos.',
    summary:
      'Un santo cotidiano que protege cables que solo cargan si los colocas en un ángulo imposible.',
    why:
      'Mezcla épica religiosa con una miseria tecnológica universal y ridícula.',
    illustration:
      'Un santo con halo, túnica y un cable pelado entre las manos, bendiciendo un móvil al 2%.',
    productText: 'Reza para que cargue',
    category: 'Tecnología cotidiana',
    status: 'Favorita',
    author: 'Packo',
    createdAt: '2026-08-28',
  },
  {
    id: 2,
    title: 'Pulpo Autónomo',
    raw: 'Un pulpo autónomo que factura en tinta.',
    summary:
      'Un pulpo freelance agotado que usa su propia tinta para emitir facturas, presupuestos y quejas.',
    why:
      'Convierte la vida laboral en una imagen literal absurda y muy dibujable.',
    illustration:
      'Pulpo con ocho brazos en una mesa, portátil, café, impresora y papeles manchados de tinta.',
    productText: 'Facturo en tinta',
    category: 'Trabajo absurdo',
    status: 'Pendiente',
    author: 'Manolo',
    createdAt: '2026-08-28',
  },
  {
    id: 3,
    title: 'Gazpacho con Manual',
    raw: 'Un señor enfadado porque el gazpacho no tiene instrucciones.',
    summary:
      'Alguien intenta montar un gazpacho como si fuese un mueble complicado.',
    why:
      'La gracia está en tratar una comida líquida como un objeto técnico imposible.',
    illustration:
      'Mesa con tomates, pepino, una llave Allen, un vaso confundido y un manual abierto.',
    productText: 'Agitar antes de tener una crisis',
    category: 'Comida dramática',
    status: 'Dibujando',
    author: 'Los dos',
    createdAt: '2026-08-28',
  },
];

const categoryHints = [
  'Tecnología cotidiana',
  'Comida dramática',
  'Trabajo absurdo',
  'Criaturas administrativas',
  'Señores raros',
  'Objetos con ansiedad',
];

function titleCase(value: string) {
  return value
    .trim()
    .replace(/[¿?¡!.,;:]+$/g, '')
    .split(/\s+/)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function pickCategory(text: string) {
  const lower = text.toLowerCase();

  if (/cable|movil|móvil|usb|ordenador|wifi|app|email|correo/.test(lower)) {
    return 'Tecnología cotidiana';
  }

  if (/gazpacho|taza|cafe|café|pan|tomate|croqueta|bocata|comida/.test(lower)) {
    return 'Comida dramática';
  }

  if (/factura|oficina|jefe|reunion|reunión|excel|autonomo|autónomo/.test(lower)) {
    return 'Trabajo absurdo';
  }

  if (/señor|senor|vecino|cuñado|cunado/.test(lower)) {
    return 'Señores raros';
  }

  return categoryHints[Math.floor(Math.random() * categoryHints.length)];
}

function makeIdea(raw: string, author: string): Idea {
  const trimmed = raw.trim();
  const category = pickCategory(trimmed);
  const title = titleCase(trimmed) || 'Idea Sin Nombre';
  const subject = trimmed.replace(/[.]+$/g, '');

  return {
    id: Date.now(),
    title,
    raw: trimmed,
    summary: `La idea gira alrededor de ${subject}, llevada a una escena clara y fácil de recordar.`,
    why:
      'Funciona porque convierte una tontería dicha en voz alta en una imagen concreta, exagerada y reconocible.',
    illustration: `Manolo podría dibujar ${subject.toLowerCase()} como si fuese algo totalmente serio, con detalles cotidianos que hagan más absurdo el contraste.`,
    productText: title.length < 20 ? title : 'Esto era necesario',
    category,
    status: 'Pendiente',
    author: author.trim() || 'Sin culpable',
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

function toDatabaseIdea(idea: Idea): DatabaseIdea {
  return {
    id: idea.id,
    title: idea.title,
    raw: idea.raw,
    summary: idea.summary,
    why: idea.why,
    illustration: idea.illustration,
    product_text: idea.productText,
    category: idea.category,
    status: idea.status,
    author: idea.author,
    created_at: idea.createdAt,
  };
}

function fromDatabaseIdea(idea: DatabaseIdea): Idea {
  return {
    id: Number(idea.id),
    title: idea.title,
    raw: idea.raw,
    summary: idea.summary,
    why: idea.why,
    illustration: idea.illustration,
    productText: idea.product_text,
    category: idea.category,
    status: idea.status,
    author: idea.author,
    createdAt: idea.created_at,
  };
}

async function fetchSharedIdeas() {
  const response = await fetch(
    `${databaseUrl}?select=id,title,raw,summary,why,illustration,product_text,category,status,author,created_at&order=created_at.desc,id.desc`,
    { headers: databaseHeaders },
  );

  if (!response.ok) {
    throw new Error('No se han podido cargar las ideas compartidas.');
  }

  const data = (await response.json()) as DatabaseIdea[];
  return data.map(fromDatabaseIdea);
}

async function importLocalIdeas(ideas: Idea[]) {
  if (!ideas.length) {
    return;
  }

  const response = await fetch(`${databaseUrl}?on_conflict=id`, {
    method: 'POST',
    headers: {
      ...databaseHeaders,
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(ideas.map(toDatabaseIdea)),
  });

  if (!response.ok) {
    throw new Error('No se han podido importar las ideas de este dispositivo.');
  }
}

async function saveSharedIdea(idea: Idea) {
  const response = await fetch(databaseUrl, {
    method: 'POST',
    headers: { ...databaseHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(toDatabaseIdea(idea)),
  });

  if (!response.ok) {
    throw new Error('La idea se ha guardado aquí, pero aún no se ha sincronizado.');
  }
}

async function saveSharedStatus(id: number, status: IdeaStatus) {
  const response = await fetch(`${databaseUrl}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...databaseHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('El estado ha cambiado aquí, pero aún no se ha sincronizado.');
  }
}

export default function ManolisimoApp() {
  const [ideas, setIdeas] = useState<Idea[]>(examples);
  const [rawIdea, setRawIdea] = useState('');
  const [author, setAuthor] = useState('Packo');
  const [activeStatus, setActiveStatus] = useState<IdeaStatus | 'Todas'>('Todas');
  const [activeId, setActiveId] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState('');
  const [syncMessage, setSyncMessage] = useState('Conectando…');
  const [syncError, setSyncError] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBaseRef = useRef('');

  useEffect(() => {
    const saved = window.localStorage.getItem('manolisimo-ideas');
    const localIdeas = saved ? (JSON.parse(saved) as Idea[]) : examples;
    let cancelled = false;

    async function startSync() {
      try {
        await importLocalIdeas(localIdeas);
        const sharedIdeas = await fetchSharedIdeas();

        if (!cancelled) {
          setIdeas(sharedIdeas);
          setSyncMessage('Sincronizado');
          setSyncError(false);
        }
      } catch {
        if (!cancelled) {
          setIdeas(localIdeas);
          setSyncMessage('Sin conexión · guardado local');
          setSyncError(true);
        }
      }
    }

    void startSync();

    const interval = window.setInterval(async () => {
      try {
        const sharedIdeas = await fetchSharedIdeas();

        if (!cancelled) {
          setIdeas(sharedIdeas);
          setSyncMessage('Sincronizado');
          setSyncError(false);
        }
      } catch {
        if (!cancelled) {
          setSyncMessage('Sin conexión · guardado local');
          setSyncError(true);
        }
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem('manolisimo-ideas', JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const filteredIdeas = useMemo(() => {
    if (activeStatus === 'Todas') {
      return ideas;
    }

    return ideas.filter((idea) => idea.status === activeStatus);
  }, [activeStatus, ideas]);

  const activeIdea = ideas.find((idea) => idea.id === activeId) ?? ideas[0];

  async function addIdea() {
    if (!rawIdea.trim()) {
      return;
    }

    const idea = makeIdea(rawIdea, author);
    setIdeas((current) => [idea, ...current]);
    setActiveId(idea.id);
    setRawIdea('');
    setSyncMessage('Guardando…');
    setSyncError(false);

    try {
      await saveSharedIdea(idea);
      setSyncMessage('Sincronizado');
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Sin conexión · guardado local');
      setSyncError(true);
    }
  }

  function toggleDictation() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setSpeechSupported(false);
      setSpeechError('Este navegador no permite transcribir la voz.');
      return;
    }

    const recognition = new Recognition();
    const existingText = rawIdea.trim();
    speechBaseRef.current = existingText ? `${existingText} ` : '';
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = '';

      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }

      setRawIdea(`${speechBaseRef.current}${transcript}`.trimStart());
    };

    recognition.onerror = (event) => {
      const message =
        event.error === 'not-allowed'
          ? 'Necesito permiso para usar el micrófono.'
          : event.error === 'no-speech'
            ? 'No he oído nada. Pulsa el micrófono para intentarlo de nuevo.'
            : 'No se ha podido transcribir. Inténtalo otra vez.';
      setSpeechError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setSpeechError('');
    setIsListening(true);

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      setSpeechError('No se ha podido iniciar el micrófono. Inténtalo otra vez.');
    }
  }

  async function updateStatus(id: number, status: IdeaStatus) {
    setIdeas((current) =>
      current.map((idea) => (idea.id === id ? { ...idea, status } : idea)),
    );
    setSyncMessage('Guardando…');
    setSyncError(false);

    try {
      await saveSharedStatus(id, status);
      setSyncMessage('Sincronizado');
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Sin conexión · guardado local');
      setSyncError(true);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#20201c]">
      <section className="app-shell">
        <header className="topbar" aria-label="Cabecera Manolisimo">
          <div>
            <p className="eyebrow">Archivo vivo de tonterías ilustrables</p>
            <h1>Manolisimo</h1>
          </div>
          <div className="counter" aria-label={`${ideas.length} ideas guardadas`}>
            <strong>{ideas.length}</strong>
            <span>ideas</span>
          </div>
        </header>

        <section className="capture-panel" aria-labelledby="new-idea-title">
          <div>
            <p className="eyebrow">Entrada rápida</p>
            <h2 id="new-idea-title">Nueva gilipollez</h2>
            <p className={syncError ? 'sync-status error' : 'sync-status'} aria-live="polite">
              <span aria-hidden="true" />
              {syncMessage}
            </p>
          </div>
          <div className="idea-input">
            <textarea
              aria-label="Escribe o dicta una idea en bruto"
              value={rawIdea}
              onChange={(event) => setRawIdea(event.target.value)}
              placeholder="Ej: un notario que certifica si una croqueta está demasiado caliente..."
            />
            <div className="dictation-row">
              <button
                aria-label={isListening ? 'Detener grabación' : 'Dictar idea con el micrófono'}
                aria-pressed={isListening}
                className={isListening ? 'dictation-button listening' : 'dictation-button'}
                disabled={!speechSupported}
                onClick={toggleDictation}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4Zm7-4a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.08A7 7 0 0 0 19 11Z" />
                </svg>
                {isListening ? 'Detener' : 'Hablar'}
              </button>
              <span aria-live="polite">
                {isListening ? 'Escuchando… habla con normalidad' : 'También puedes dictar la idea'}
              </span>
            </div>
            {speechError && <p className="speech-error" role="alert">{speechError}</p>}
          </div>
          <div className="capture-actions">
            <label>
              Culpable
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                aria-label="Autor de la idea"
              />
            </label>
            <button onClick={addIdea} type="button">
              Ordenar idea
            </button>
          </div>
        </section>

        <nav className="status-tabs" aria-label="Filtrar ideas por estado">
          {(['Todas', ...statuses] as const).map((status) => (
            <button
              className={activeStatus === status ? 'active' : ''}
              key={status}
              onClick={() => setActiveStatus(status)}
              type="button"
            >
              {status}
            </button>
          ))}
        </nav>

        <section className="workspace">
          <div className="idea-list" aria-label="Lista de ideas">
            {filteredIdeas.map((idea) => (
              <button
                className={activeIdea?.id === idea.id ? 'idea-row selected' : 'idea-row'}
                key={idea.id}
                onClick={() => setActiveId(idea.id)}
                type="button"
              >
                <span>
                  <strong>{idea.title}</strong>
                  <small>{idea.category}</small>
                </span>
                <em>{idea.status}</em>
              </button>
            ))}
          </div>

          {activeIdea ? (
            <article className="idea-card" aria-label={`Ficha de ${activeIdea.title}`}>
              <div className="idea-card-header">
                <div>
                  <p className="eyebrow">{activeIdea.category}</p>
                  <h2>{activeIdea.title}</h2>
                </div>
                <select
                  aria-label="Cambiar estado"
                  value={activeIdea.status}
                  onChange={(event) => {
                    void updateStatus(activeIdea.id, event.target.value as IdeaStatus);
                  }}
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <dl className="idea-fields">
                <div>
                  <dt>Frase original</dt>
                  <dd>{activeIdea.raw}</dd>
                </div>
                <div>
                  <dt>Versión ordenada</dt>
                  <dd>{activeIdea.summary}</dd>
                </div>
                <div>
                  <dt>Por qué hace gracia</dt>
                  <dd>{activeIdea.why}</dd>
                </div>
                <div>
                  <dt>Posible ilustración</dt>
                  <dd>{activeIdea.illustration}</dd>
                </div>
                <div>
                  <dt>Texto para producto</dt>
                  <dd className="product-text">{activeIdea.productText}</dd>
                </div>
              </dl>

              <footer>
                <span>{activeIdea.author}</span>
                <span>{activeIdea.createdAt}</span>
              </footer>
            </article>
          ) : (
            <article className="empty-state">
              <h2>No hay ideas en este filtro</h2>
              <p>Cambia de estado o añade una nueva desde la entrada rápida.</p>
            </article>
          )}
        </section>
      </section>
    </main>
  );
}

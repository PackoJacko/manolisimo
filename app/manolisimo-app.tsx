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

type IdeaStatus = 'Pendiente' | 'Favorita' | 'Dibujando' | 'Hecha' | 'Descartada';

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

type EditableIdeaFields = Pick<
  Idea,
  'raw' | 'summary' | 'why' | 'illustration' | 'productText'
>;

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

type IdeaSketch = {
  id: number;
  ideaId: number;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  publicUrl: string;
};

type DatabaseSketch = {
  id: number;
  idea_id: number;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

const databaseUrl = 'https://vlajqijjekgmwwajugfl.supabase.co/rest/v1/ideas';
const sketchesDatabaseUrl = 'https://vlajqijjekgmwwajugfl.supabase.co/rest/v1/idea_sketches';
const sketchesStorageUrl = 'https://vlajqijjekgmwwajugfl.supabase.co/storage/v1/object/idea-sketches';
const sketchesPublicUrl = 'https://vlajqijjekgmwwajugfl.supabase.co/storage/v1/object/public/idea-sketches';
const databaseKey = 'sb_publishable_rLOoqZ7G1wwLzG32tTZhtw_0mbOJWbL';
const maxSketchSize = 5 * 1024 * 1024;
const allowedSketchTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const databaseHeaders = {
  apikey: databaseKey,
  'Content-Type': 'application/json',
};

const statuses: IdeaStatus[] = ['Pendiente', 'Favorita', 'Dibujando', 'Hecha', 'Descartada'];

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
  'Refrán torcido',
  'Música y colegas',
  'Familia peligrosa',
  'Criaturas administrativas',
  'Señores raros',
  'Objetos con ansiedad',
];

const benitezTraits = [
  'Línea negra gruesa y nerviosa sobre fondo limpio',
  'Personajes de nariz protagonista, boca grande y gesto teatral',
  'Colores planos con acentos mostaza, naranja, negro, gris y algún golpe vivo',
  'Humor de refrán español torcido, literalidad absurda y costumbrismo bruto',
];

const productPhrases = [
  'Muchas gracias',
  'Me hago el sordo',
  'Igual se cae',
  'Que viva esto',
  'No era necesario',
  'Ojo que viene',
  'A mi manera',
];

const editableFieldLabels: Array<{
  key: keyof EditableIdeaFields;
  label: string;
  multiline: boolean;
}> = [
  { key: 'raw', label: 'Frase original', multiline: true },
  { key: 'summary', label: 'Versión ordenada', multiline: true },
  { key: 'why', label: 'Por qué hace gracia', multiline: true },
  { key: 'illustration', label: 'Posible ilustración', multiline: true },
  { key: 'productText', label: 'Texto para producto', multiline: false },
];

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

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

  if (/refran|refrán|dicho|mal anda|caballo regalado|palabras necias|cuervos/.test(lower)) {
    return 'Refrán torcido';
  }

  if (/jefe|curro|trabajo|oficina|factura|reunion|reunión|excel|autonomo|autónomo/.test(lower)) {
    return 'Trabajo absurdo';
  }

  if (/colega|amigo|equipo|peña|fiesta|futbol|fútbol/.test(lower)) {
    return 'Música y colegas';
  }

  if (/suegra|familia|cuñado|cunado|vecino/.test(lower)) {
    return 'Familia peligrosa';
  }

  if (/cable|movil|móvil|usb|ordenador|wifi|app|email|correo/.test(lower)) {
    return 'Tecnología cotidiana';
  }

  if (/gazpacho|taza|cafe|café|pan|tomate|croqueta|bocata|comida/.test(lower)) {
    return 'Comida dramática';
  }

  if (/señor|senor|vecino|cuñado|cunado/.test(lower)) {
    return 'Señores raros';
  }

  return categoryHints[Math.floor(Math.random() * categoryHints.length)];
}

function makeBenitezProductText(title: string, raw: string) {
  const lower = raw.toLowerCase();

  if (lower.includes('...')) {
    return raw
      .split('...')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(-1)[0]
      ?.replace(/[.]+$/g, '') || title;
  }

  if (/[¿?¡!]/.test(raw) && raw.length <= 34) {
    return raw.replace(/[.]+$/g, '');
  }

  if (title.length <= 22) {
    return title;
  }

  return productPhrases[Math.floor(Math.random() * productPhrases.length)];
}

function makeIdea(raw: string, author: string): Idea {
  const trimmed = raw.trim();
  const category = pickCategory(trimmed);
  const title = titleCase(trimmed) || 'Idea Sin Nombre';
  const subject = trimmed.replace(/[.]+$/g, '');
  const isSaying = /refran|refrán|dicho|\.{3}|mal anda|caballo regalado|palabras necias|cuervos/.test(
    trimmed.toLowerCase(),
  );

  return {
    id: Date.now(),
    title,
    raw: trimmed,
    summary: isSaying
      ? `La idea funciona como un refrán conocido llevado hacia una salida más tonta, literal y de camiseta.`
      : `La idea gira alrededor de ${subject}, convertida en una escena cotidiana con una exageración clara.`,
    why:
      'Encaja con Benítez+ porque trata una frase normal como si fuese una situación física real: poco decorado, gesto grande, remate seco y absurdo reconocible.',
    illustration: `Dibujarlo como una viñeta limpia: personaje central de nariz marcada y boca expresiva, línea negra gruesa, sombra gris suave, dos o tres detalles de contexto y un color protagonista tipo mostaza, naranja, verde o rojo.`,
    productText: makeBenitezProductText(title, trimmed),
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

function sketchPublicUrl(storagePath: string) {
  return `${sketchesPublicUrl}/${storagePath.split('/').map(encodeURIComponent).join('/')}`;
}

function fromDatabaseSketch(sketch: DatabaseSketch): IdeaSketch {
  return {
    id: Number(sketch.id),
    ideaId: Number(sketch.idea_id),
    storagePath: sketch.storage_path,
    fileName: sketch.file_name,
    mimeType: sketch.mime_type,
    sizeBytes: Number(sketch.size_bytes),
    createdAt: sketch.created_at,
    publicUrl: sketchPublicUrl(sketch.storage_path),
  };
}

async function fetchSharedSketches() {
  const response = await fetch(
    `${sketchesDatabaseUrl}?select=id,idea_id,storage_path,file_name,mime_type,size_bytes,created_at&order=created_at.desc,id.desc`,
    { headers: databaseHeaders },
  );

  if (!response.ok) {
    throw new Error('No se han podido cargar los bocetos adjuntos.');
  }

  return ((await response.json()) as DatabaseSketch[]).map(fromDatabaseSketch);
}

function safeFileName(name: string) {
  const extension = name.includes('.') ? `.${name.split('.').pop()?.toLowerCase()}` : '';
  const base = name
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'boceto';

  return `${base}${extension}`;
}

async function uploadSharedSketch(ideaId: number, file: File) {
  const storagePath = `${ideaId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
  const uploadResponse = await fetch(`${sketchesStorageUrl}/${encodedPath}`, {
    method: 'POST',
    headers: {
      apikey: databaseKey,
      'Content-Type': file.type,
      'x-upsert': 'false',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`No se ha podido subir ${file.name}.`);
  }

  const metadataResponse = await fetch(sketchesDatabaseUrl, {
    method: 'POST',
    headers: { ...databaseHeaders, Prefer: 'return=representation' },
    body: JSON.stringify({
      idea_id: ideaId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    }),
  });

  if (!metadataResponse.ok) {
    throw new Error(`El archivo ${file.name} se ha subido, pero no se ha podido adjuntar a la ficha.`);
  }

  const [savedSketch] = (await metadataResponse.json()) as DatabaseSketch[];
  return fromDatabaseSketch(savedSketch);
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

async function saveSharedIdeaDetails(id: number, fields: EditableIdeaFields) {
  const response = await fetch(`${databaseUrl}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...databaseHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify({
      raw: fields.raw,
      summary: fields.summary,
      why: fields.why,
      illustration: fields.illustration,
      product_text: fields.productText,
    }),
  });

  if (!response.ok) {
    throw new Error('Cambios guardados aquí; pendiente de sincronizar.');
  }
}

async function deleteSharedIdea(id: number) {
  const response = await fetch(`${databaseUrl}?id=eq.${id}`, {
    method: 'DELETE',
    headers: { ...databaseHeaders, Prefer: 'return=minimal' },
  });

  if (!response.ok) {
    throw new Error('No se ha podido eliminar la ficha compartida.');
  }
}

function makeDraft(idea: Idea): EditableIdeaFields {
  return {
    raw: idea.raw,
    summary: idea.summary,
    why: idea.why,
    illustration: idea.illustration,
    productText: idea.productText,
  };
}

function exportIdeaPdf(idea: Idea) {
  const popup = window.open('', '_blank');

  if (!popup) {
    window.alert('No he podido abrir la ventana de PDF. Revisa el bloqueador de ventanas.');
    return;
  }

  const fields = [
    ['Frase original', idea.raw],
    ['Versión ordenada', idea.summary],
    ['Por qué hace gracia', idea.why],
    ['Posible ilustración', idea.illustration],
    ['Texto para producto', idea.productText],
  ];

  popup.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(idea.title)} · Manolisimo</title>
        <style>
          @page { size: A4; margin: 16mm; }
          * { box-sizing: border-box; }
          body {
            color: #20201c;
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
          }
          .sheet {
            border: 3px solid #20201c;
            min-height: 260mm;
            padding: 22px;
          }
          .brand {
            align-items: center;
            border-bottom: 3px solid #20201c;
            display: flex;
            gap: 16px;
            padding-bottom: 18px;
          }
          .brand img {
            background: #f6c119;
            border: 2px solid #20201c;
            height: 72px;
            object-fit: cover;
            width: 72px;
          }
          .eyebrow {
            color: #2f6d5a;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
          }
          h1 {
            font-size: 42px;
            line-height: 0.95;
            margin: 4px 0 0;
          }
          .meta {
            color: #776f63;
            display: flex;
            font-size: 13px;
            font-weight: 700;
            justify-content: space-between;
            margin: 14px 0 24px;
          }
          .field {
            border-top: 2px solid #ded5c5;
            padding: 14px 0;
          }
          dt {
            color: #2f6d5a;
            font-size: 12px;
            font-weight: 900;
            margin-bottom: 7px;
            text-transform: uppercase;
          }
          dd {
            font-size: 17px;
            line-height: 1.45;
            margin: 0;
          }
          .product {
            background: #20201c;
            color: #fffaf0;
            display: inline-block;
            font-size: 32px;
            font-weight: 950;
            line-height: 1;
            padding: 12px 14px;
          }
          .print-note {
            color: #776f63;
            font-size: 12px;
            margin-top: 24px;
          }
          @media print {
            .print-note { display: none; }
          }
        </style>
      </head>
      <body>
        <section class="sheet">
          <header class="brand">
            <img src="${new URL('/benitez-logo.jpg', window.location.origin).href}" alt="Logo Benítez+" />
            <div>
              <div class="eyebrow">Ficha Manolisimo · ${escapeHtml(idea.category)}</div>
              <h1>${escapeHtml(idea.title)}</h1>
            </div>
          </header>
          <div class="meta">
            <span>${escapeHtml(idea.author)}</span>
            <span>${escapeHtml(idea.status)} · ${escapeHtml(idea.createdAt)}</span>
          </div>
          <dl>
            ${fields
              .map(
                ([label, value]) => `
                  <div class="field">
                    <dt>${escapeHtml(label)}</dt>
                    <dd class="${label === 'Texto para producto' ? 'product' : ''}">${escapeHtml(value)}</dd>
                  </div>
                `,
              )
              .join('')}
          </dl>
          <p class="print-note">Usa Imprimir o Guardar como PDF para compartir esta ficha.</p>
        </section>
        <script>
          window.addEventListener('load', () => window.print());
        </script>
      </body>
    </html>
  `);
  popup.document.close();
}

export default function ManolisimoApp() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [sketches, setSketches] = useState<IdeaSketch[]>([]);
  const [rawIdea, setRawIdea] = useState('');
  const [author, setAuthor] = useState('Packo');
  const [activeStatus, setActiveStatus] = useState<IdeaStatus | 'Todas'>('Todas');
  const [activeId, setActiveId] = useState(1);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState('');
  const [syncMessage, setSyncMessage] = useState('Conectando…');
  const [syncError, setSyncError] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EditableIdeaFields | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechBaseRef = useRef('');

  useEffect(() => {
    const saved = window.localStorage.getItem('manolisimo-ideas');
    const localIdeas = saved ? (JSON.parse(saved) as Idea[]) : [];
    let cancelled = false;

    async function startSync() {
      try {
        const [sharedIdeas, sharedSketches] = await Promise.all([
          fetchSharedIdeas(),
          fetchSharedSketches(),
        ]);

        if (!cancelled) {
          setIdeas(sharedIdeas);
          setSketches(sharedSketches);
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
        const [sharedIdeas, sharedSketches] = await Promise.all([
          fetchSharedIdeas(),
          fetchSharedSketches(),
        ]);

        if (!cancelled) {
          setIdeas(sharedIdeas);
          setSketches(sharedSketches);
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

  const activeIdea =
    filteredIdeas.find((idea) => idea.id === activeId) ?? filteredIdeas[0];
  const isEditing = Boolean(activeIdea && editingId === activeIdea.id && draft);
  const activeSketches = activeIdea
    ? sketches.filter((sketch) => sketch.ideaId === activeIdea.id)
    : [];

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

  function startEditing(idea: Idea) {
    setEditingId(idea.id);
    setDraft(makeDraft(idea));
  }

  function updateDraft(key: keyof EditableIdeaFields, value: string) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEdits(idea: Idea) {
    if (!draft) {
      return;
    }

    const updatedIdea = { ...idea, ...draft };
    setIdeas((current) =>
      current.map((currentIdea) => (currentIdea.id === idea.id ? updatedIdea : currentIdea)),
    );
    setEditingId(null);
    setDraft(null);
    setSyncMessage('Guardando…');
    setSyncError(false);

    try {
      await saveSharedIdeaDetails(idea.id, draft);
      setSyncMessage('Sincronizado');
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Sin conexión · guardado local');
      setSyncError(true);
    }
  }

  async function deleteIdea(idea: Idea) {
    if (idea.status !== 'Descartada') {
      window.alert('Primero marca la ficha como Descartada para poder eliminarla.');
      return;
    }

    const confirmation = window.prompt(
      `Para eliminar definitivamente "${idea.title}", escribe ELIMINAR.`,
    );

    if (confirmation !== 'ELIMINAR') {
      return;
    }

    const remainingIdeas = ideas.filter((currentIdea) => currentIdea.id !== idea.id);
    setIdeas(remainingIdeas);
    setSketches((current) => current.filter((sketch) => sketch.ideaId !== idea.id));
    setEditingId(null);
    setDraft(null);
    setActiveId(remainingIdeas[0]?.id ?? 0);
    setSyncMessage('Eliminando…');
    setSyncError(false);

    try {
      await deleteSharedIdea(idea.id);
      setSyncMessage('Ficha eliminada');
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'No se ha podido eliminar la ficha.');
      setSyncError(true);
    }
  }

  async function attachSketches(files: FileList | null) {
    if (!activeIdea || !files?.length) {
      return;
    }

    const selectedFiles = Array.from(files).slice(0, 5);
    const invalidFile = selectedFiles.find(
      (file) => !allowedSketchTypes.has(file.type) || file.size <= 0 || file.size > maxSketchSize,
    );

    if (invalidFile) {
      setUploadMessage(
        `${invalidFile.name} no es una imagen compatible o supera el límite de 5 MB.`,
      );
      setUploadError(true);
      return;
    }

    setIsUploading(true);
    setUploadError(false);

    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        setUploadMessage(`Subiendo ${index + 1} de ${selectedFiles.length}…`);
        const savedSketch = await uploadSharedSketch(activeIdea.id, selectedFiles[index]);
        setSketches((current) => [savedSketch, ...current]);
      }

      setUploadMessage(
        selectedFiles.length === 1 ? 'Boceto adjuntado' : `${selectedFiles.length} bocetos adjuntados`,
      );
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'No se han podido adjuntar los bocetos.');
      setUploadError(true);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#20201c]">
      <section className="app-shell">
        <header className="topbar" aria-label="Cabecera Manolisimo">
          <div className="brand-lockup">
            <img src="/benitez-logo.jpg" alt="Logo de Benítez+" />
            <div>
              <p className="eyebrow">Archivo vivo de tonterías ilustrables</p>
              <h1>Manolisimo</h1>
            </div>
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

        <section className="style-panel" aria-labelledby="style-panel-title">
          <div>
            <p className="eyebrow">ADN Benítez+</p>
            <h2 id="style-panel-title">Humor de refrán reventado y personaje con gesto</h2>
          </div>
          <ul>
            {benitezTraits.map((trait) => (
              <li key={trait}>{trait}</li>
            ))}
          </ul>
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
                <div className="idea-tools">
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
                  <button className="tool-button" onClick={() => exportIdeaPdf(activeIdea)} type="button">
                    PDF
                  </button>
                  {activeIdea.status === 'Descartada' && (
                    <button
                      className="tool-button danger"
                      onClick={() => {
                        void deleteIdea(activeIdea);
                      }}
                      type="button"
                    >
                      Eliminar
                    </button>
                  )}
                  {isEditing ? (
                    <>
                      <button
                        className="tool-button primary"
                        onClick={() => {
                          void saveEdits(activeIdea);
                        }}
                        type="button"
                      >
                        Guardar
                      </button>
                      <button className="tool-button" onClick={cancelEditing} type="button">
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="tool-button primary" onClick={() => startEditing(activeIdea)} type="button">
                      Editar
                    </button>
                  )}
                </div>
              </div>

              <dl className="idea-fields">
                {editableFieldLabels.map((field) => (
                  <div key={field.key}>
                    <dt>{field.label}</dt>
                    <dd className={field.key === 'productText' && !isEditing ? 'product-text' : ''}>
                      {isEditing && draft ? (
                        field.multiline ? (
                          <textarea
                            aria-label={field.label}
                            className="edit-textarea"
                            value={draft[field.key]}
                            onChange={(event) => updateDraft(field.key, event.target.value)}
                          />
                        ) : (
                          <input
                            aria-label={field.label}
                            className="edit-input"
                            value={draft[field.key]}
                            onChange={(event) => updateDraft(field.key, event.target.value)}
                          />
                        )
                      ) : (
                        activeIdea[field.key]
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <section className="sketches-section" aria-labelledby="sketches-title">
                <div className="sketches-heading">
                  <div>
                    <p className="eyebrow">Material visual</p>
                    <h3 id="sketches-title">Bocetos adjuntos</h3>
                  </div>
                  <label className={isUploading ? 'sketch-upload disabled' : 'sketch-upload'}>
                    <input
                      accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                      disabled={isUploading}
                      multiple
                      onChange={(event) => {
                        void attachSketches(event.target.files);
                        event.target.value = '';
                      }}
                      type="file"
                    />
                    {isUploading ? 'Subiendo…' : '+ Adjuntar bocetos'}
                  </label>
                </div>

                {activeSketches.length ? (
                  <div className="sketch-grid">
                    {activeSketches.map((sketch) => (
                      <a
                        aria-label={`Abrir boceto ${sketch.fileName}`}
                        href={sketch.publicUrl}
                        key={sketch.id}
                        rel="noreferrer"
                        target="_blank"
                        title={sketch.fileName}
                      >
                        <img alt={sketch.fileName} loading="lazy" src={sketch.publicUrl} />
                        <span>{sketch.fileName}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="sketch-empty">Todavía no hay bocetos en esta ficha.</p>
                )}

                <p className={uploadError ? 'upload-message error' : 'upload-message'} aria-live="polite">
                  {uploadMessage || 'JPG, PNG, WebP, GIF o foto del móvil · máximo 5 MB por archivo'}
                </p>
              </section>

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

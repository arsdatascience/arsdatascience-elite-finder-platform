// Skipped modification of audioController.js as it uses local storage for temporary processing only.
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const pool = require('./database');

// Inicializar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Configuração do Multer para salvar temporariamente
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Sanitizar nome do arquivo
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, Date.now() + '-' + safeName);
    }
});

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.mpeg', '.mpga', '.opus', '.webm', '.mp4'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo não suportado. Use MP3, WAV, OGG, M4A, FLAC, MPEG, MPGA, OPUS.'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Limite de 20MB
    fileFilter: fileFilter
});

exports.uploadMiddleware = upload.single('audio');

exports.analyzeAudio = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    let filePath = req.file.path;

    // Hack para arquivos .opus (comum no WhatsApp): renomear para .ogg para a OpenAI aceitar
    if (path.extname(req.file.originalname).toLowerCase() === '.opus') {
        const newPathWithExt = filePath + '.ogg';
        try {
            fs.renameSync(filePath, newPathWithExt);
            filePath = newPathWithExt;
        } catch (e) {
            console.error('Erro ao renomear .opus:', e);
        }
    }

    try {
        // 1. Transcrição com Whisper
        console.log(`[AudioAnalysis] Iniciando transcrição do arquivo: ${req.file.originalname} (Path: ${filePath})`);

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-1',
            response_format: 'verbose_json',
            timestamp_granularities: ['segment']
        });

        console.log('[AudioAnalysis] Transcrição concluída. Iniciando análise com GPT-4o...');

        // Preparar dados para o GPT
        const segmentsForAnalysis = transcription.segments.map(s => ({
            id: s.id,
            start: s.start,
            end: s.end,
            text: s.text
        }));

        // 2. Análise com GPT-4o
        const prompt = `
      Você é um especialista em análise de conversas e sentimento.
      Analise a seguinte transcrição de áudio (obtida via Whisper).
      
      Tarefas:
      1. Identifique os falantes (ex: Speaker A, Speaker B) baseando-se no contexto.
      2. Para cada segmento, determine o sentimento (Positivo, Negativo, Neutro) e confiança (0.0 a 1.0).
      3. Gere um resumo executivo.
      4. Calcule o sentimento global.

      Transcrição (Segmentos):
      ${JSON.stringify(segmentsForAnalysis)}

      Retorne estritamente um JSON com a seguinte estrutura:
      {
        "summary": "Texto do resumo...",
        "globalSentiment": { 
            "label": "Positivo" | "Negativo" | "Neutro", 
            "score": 0.0 to 1.0 
        },
        "speakers": ["Speaker A", "Speaker B"],
        "segments": [
          {
            "id": 0,
            "speaker": "Speaker A",
            "text": "Texto original...",
            "timestampStart": 0.0,
            "timestampEnd": 2.5,
            "sentiment": "Positivo",
            "sentimentScore": 0.9
          }
        ]
      }
    `;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'Você é um assistente útil que analisa transcrições de áudio e retorna JSON.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        // Limpeza do arquivo temporário
        fs.unlinkSync(filePath);

        console.log('[AudioAnalysis] Análise concluída. Salvando no banco...');

        // Salvar no banco
        let savedId = null;
        let createdAt = new Date();

        try {
            const result = await pool.query(
                `INSERT INTO audio_analyses (user_id, filename, summary, global_sentiment, speakers, segments)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, created_at`,
                [
                    req.user.id,
                    req.file.originalname,
                    analysis.summary,
                    analysis.globalSentiment,
                    JSON.stringify(analysis.speakers),
                    JSON.stringify(analysis.segments)
                ]
            );
            savedId = result.rows[0].id;
            createdAt = result.rows[0].created_at;
        } catch (dbError) {
            console.error('Erro ao salvar no banco:', dbError);
        }

        res.json({
            success: true,
            data: { ...analysis, id: savedId, created_at: createdAt }
        });

    } catch (error) {
        console.error('[AudioAnalysis] Erro:', error);
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) { }
        }
        res.status(500).json({ error: 'Erro ao processar áudio', details: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, filename, created_at, global_sentiment 
             FROM audio_analyses 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
};

exports.getAnalysis = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM audio_analyses WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Análise não encontrada' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar análise' });
    }
};

exports.deleteAnalysis = async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM audio_analyses WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir análise' });
    }
};

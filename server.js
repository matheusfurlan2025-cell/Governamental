/**
 * ============================================================================
 * NEXUSERP GOV & PRO - SERVIDOR BACKEND (NODE.JS + EXPRESS + MONGODB + JWT)
 * Hospedagem: Render.com | Banco de Dados: MongoDB Atlas
 * ============================================================================
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// ============================================================================
// 1. CONFIGURAÇÕES DE MIDDLEWARE E CORS (Comunicação com seu site no Netlify)
// ============================================================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limite de 12MB para suportar envio do Logotipo da Empresa em alta resolução
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// >>> ONDE CONFIGURAR NO CÓDIGO (OU NAS VARIÁVEIS DE AMBIENTE DO RENDER):
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'COLE_AQUI_SUA_URL_DO_MONGODB_ATLAS';
const JWT_SECRET = process.env.JWT_SECRET || 'chave_governamental_corporativa_2026_segura';

// ============================================================================
// 2. CONEXÃO COM O MONGODB ATLAS
// ============================================================================
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Atlas conectado com sucesso!'))
    .catch((err) => console.error('❌ Erro ao conectar no MongoDB:', err.message));

// ============================================================================
// 3. MODELS / SCHEMAS DO BANCO DE DADOS (Padrão Governamental & Contábil)
// ============================================================================

// 3.1 Usuário Administrador
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'Representante Legal / Admin' },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

// 3.2 Ficha Cadastral Oficial da Empresa (Padrão CNPJ / Junta Comercial)
const CompanySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    razaoSocial: { type: String, default: 'Empresa Modelo Brasil LTDA' },
    nomeFantasia: { type: String, default: 'Empresa Modelo' },
    cnpj: { type: String, default: '' },
    ie: { type: String, default: 'ISENTO' },
    im: { type: String, default: '' },
    cnaePrincipal: { type: String, default: '62.01-5-01 - Desenvolvimento de programas de computador sob encomenda' },
    naturezaJuridica: { type: String, default: '206-2 - Sociedade Empresária Limitada' },
    regime: { type: String, default: 'MEI - Microempreendedor Individual' }, // MEI, Simples Nacional, Lucro Presumido, Lucro Real
    porte: { type: String, default: 'ME / Microempresa' },
    dataAbertura: { type: String, default: '2023-01-15' },
    situacaoCadastral: { type: String, default: 'ATIVA' },
    cpfResponsavel: { type: String, default: '' },
    nomeResponsavel: { type: String, default: '' },
    capital: { type: Number, default: 50000 },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    cep: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    pixInfo: { type: String, default: '' },
    quoteTerms: { type: String, default: 'Proposta emitida conforme legislação vigente. Garantia legal de 90 dias.' },
    primaryColor: { type: String, default: '#1e3a8a' },
    logoUrl: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
});
const Company = mongoose.model('Company', CompanySchema);

// 3.3 Quadro de Sócios e Administradores (QSA)
const PartnerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    cpf: { type: String, default: '' },
    role: { type: String, default: 'Sócio-Administrador' },
    share: { type: Number, default: 100 },
    proLabore: { type: Number, default: 1518 },
    inssRetido: { type: Number, default: 166.98 },
    createdAt: { type: Date, default: Date.now }
});
const Partner = mongoose.model('Partner', PartnerSchema);

// 3.4 Orçamentos e Propostas Comerciais
const QuoteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    number: { type: String, required: true },
    clientName: { type: String, required: true },
    clientDoc: { type: String, default: '' },
    clientPhone: { type: String, default: '' },
    validUntil: { type: String, default: '' },
    paymentTerms: { type: String, default: 'PIX à vista' },
    deliveryTime: { type: String, default: 'Imediato' },
    revenueNature: { type: String, default: 'SERVICO' }, // SERVICO, COMERCIO, INDUSTRIA
    notes: { type: String, default: '' },
    items: [{
        desc: String,
        unit: { type: String, default: 'UN' },
        qty: Number,
        price: Number,
        total: Number
    }],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    freight: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, default: 'Pendente' },
    createdAt: { type: Date, default: Date.now }
});
const Quote = mongoose.model('Quote', QuoteSchema);

// 3.5 Caixa Operacional, Folha de Pagamento & Rastreabilidade 100% de Renda
const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    traceCode: { type: String, required: true }, // Código único de rastreabilidade governamental
    type: { type: String, enum: ['RECEITA', 'DESPESA'], required: true },
    desc: { type: String, required: true },
    entityName: { type: String, default: '' }, // Fonte Pagadora ou Favorecido
    entityDoc: { type: String, default: '' },  // CPF ou CNPJ obrigatório para rastreio
    docNumber: { type: String, default: '' },  // Nº da Nota Fiscal, Recibo ou Contrato
    revenueNature: {
        type: String,
        enum: ['SERVICO', 'COMERCIO', 'INDUSTRIA', 'CUSTO_DEDUTIVEL', 'FOLHA_PAGAMENTO', 'DESPESA_GERAL'],
        default: 'SERVICO'
    },
    deductible: { type: Boolean, default: true }, // Define se abate na base de cálculo do Livro Caixa
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    competence: { type: String, default: '' }, // Ex: 10/2026
    status: { type: String, enum: ['PAGO', 'PENDENTE'], default: 'PAGO' },
    createdAt: { type: Date, default: Date.now }
});
const Transaction = mongoose.model('Transaction', TransactionSchema);

// 3.6 Módulo Exclusivo de Legalidades, Guias DAS, Impostos & Obrigações Fiscais
const TaxLegalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true }, // Ex: DAS-MEI, PGDAS-SN, DARF-IRPJ, ALVARA-MUN
    title: { type: String, required: true },
    kind: { type: String, enum: ['DAS_MEI', 'SIMPLES_NACIONAL', 'DARF_IMPOSTO', 'LEGALIDADE_CERTIDAO'], default: 'DAS_MEI' },
    competence: { type: String, required: true }, // Ex: 10/2026
    dueDate: { type: String, required: true },
    baseRevenue: { type: Number, default: 0 }, // Renda rastreada que originou o cálculo
    deductionsApplied: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    barcode: { type: String, default: '' },
    status: { type: String, enum: ['PAGO', 'ABERTO'], default: 'ABERTO' },
    createdAt: { type: Date, default: Date.now }
});
const TaxLegal = mongoose.model('TaxLegal', TaxLegalSchema);

// 3.7 Clientes e Fornecedores
const ClientSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    doc: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});
const Client = mongoose.model('Client', ClientSchema);

// 3.8 Catálogo de Produtos e Serviços
const CatalogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, default: 'SERVICO' }, // SERVICO ou COMERCIO
    unit: { type: String, default: 'UN' },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});
const Catalog = mongoose.model('Catalog', CatalogSchema);

const collectionsMap = {
    partners: Partner,
    quotes: Quote,
    transactions: Transaction,
    taxes: TaxLegal,
    clients: Client,
    catalog: Catalog
};

// ============================================================================
// 4. MIDDLEWARE DE AUTENTICAÇÃO JWT
// ============================================================================
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Sessão expirada ou token inválido.' });
    }
}

// ============================================================================
// 5. ROTAS PÚBLICAS (STATUS E AUTENTICAÇÃO)
// ============================================================================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'NexusERP Gov & Pro API',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, companyName, cnpj } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ error: 'Este e-mail já está registrado.' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name || 'Representante Legal',
            email: email.toLowerCase().trim(),
            passwordHash
        });
        await Company.create({
            userId: user._id,
            razaoSocial: companyName || 'Minha Empresa LTDA',
            nomeFantasia: companyName || 'Minha Empresa',
            cnpj: cnpj || '',
            nomeResponsavel: user.name,
            email: user.email
        });
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao registrar conta: ' + err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: (email || '').toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: 'Conta não localizada. Verifique o e-mail ou cadastre a empresa.' });
        }
        const validPass = await bcrypt.compare(password || '', user.passwordHash);
        if (!validPass) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }
        const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Erro interno no login: ' + err.message });
    }
});

// ============================================================================
// 6. ROTAS PRIVADAS DO ERP (SINCRONIZAÇÃO MONGODB)
// ============================================================================
app.get('/api/bootstrap', authMiddleware, async (req, res) => {
    try {
        let company = await Company.findOne({ userId: req.userId });
        if (!company) company = await Company.create({ userId: req.userId });

        const [partners, quotes, transactions, taxes, clients, catalog] = await Promise.all([
            Partner.find({ userId: req.userId }).sort({ createdAt: -1 }),
            Quote.find({ userId: req.userId }).sort({ createdAt: -1 }),
            Transaction.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 }),
            TaxLegal.find({ userId: req.userId }).sort({ dueDate: -1, createdAt: -1 }),
            Client.find({ userId: req.userId }).sort({ createdAt: -1 }),
            Catalog.find({ userId: req.userId }).sort({ createdAt: -1 })
        ]);

        res.json({ company, partners, quotes, transactions, taxes, clients, catalog });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao sincronizar dados: ' + err.message });
    }
});

app.put('/api/company', authMiddleware, async (req, res) => {
    try {
        const updateData = { ...req.body, userId: req.userId, updatedAt: new Date() };
        delete updateData._id;
        const company = await Company.findOneAndUpdate(
            { userId: req.userId },
            { $set: updateData },
            { new: true, upsert: true }
        );
        res.json(company);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao salvar ficha cadastral: ' + err.message });
    }
});

app.post('/api/:collection', authMiddleware, async (req, res) => {
    try {
        const Model = collectionsMap[req.params.collection];
        if (!Model) return res.status(400).json({ error: 'Coleção inválida.' });
        const doc = await Model.create({ ...req.body, userId: req.userId });
        res.status(201).json(doc);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar registro: ' + err.message });
    }
});

app.put('/api/:collection/:id', authMiddleware, async (req, res) => {
    try {
        const Model = collectionsMap[req.params.collection];
        if (!Model) return res.status(400).json({ error: 'Coleção inválida.' });
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.userId;
        const updated = await Model.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { $set: updateData },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar registro: ' + err.message });
    }
});

app.delete('/api/:collection/:id', authMiddleware, async (req, res) => {
    try {
        const Model = collectionsMap[req.params.collection];
        if (!Model) return res.status(400).json({ error: 'Coleção inválida.' });
        await Model.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        res.json({ deleted: true, id: req.params.id });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir registro: ' + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor NexusERP Gov rodando na porta ${PORT}`);
});
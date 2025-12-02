<div className="flex items-center gap-4">
    <button onClick={() => setView('list')} className="bg-white border border-gray-300 p-2 rounded-lg hover:bg-gray-50 text-gray-600">
        <X size={20} />
    </button>
    <div>
        <h2 className="text-2xl font-bold text-gray-800">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <p className="text-sm text-gray-500">{editingId ? 'Atualize os dados do cliente.' : 'Preencha os dados completos para cadastro.'}</p>
    </div>
</div>
            </div >

    { successMsg && (
        <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 animate-fade-in">
            <Check size={20} />
            {successMsg}
        </div>
    )}

<form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

    {/* Seção 1: Dados Principais */}
    <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="text-blue-500" size={20} />
            Dados Principais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pessoa</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="PJ"
                            {...register('type')}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">Pessoa Jurídica (PJ)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="PF"
                            {...register('type')}
                            className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">Pessoa Física (PF)</span>
                    </label>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedType === 'PJ' ? 'CNPJ' : 'CPF'}
                </label>
                <input
                    type="text"
                    {...register('document')}
                    onChange={handleDocumentChange}
                    placeholder={selectedType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.document ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.document && <p className="text-red-500 text-xs mt-1">{errors.document.message}</p>}
            </div>
            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedType === 'PJ' ? 'Razão Social / Nome Fantasia' : 'Nome Completo'}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {selectedType === 'PJ' ? <Building2 className="text-gray-400" size={18} /> : <User className="text-gray-400" size={18} />}
                    </div>
                    <input
                        type="text"
                        {...register('name')}
                        className={`w-full pl-10 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {selectedType === 'PJ' ? 'Data de Fundação' : 'Data de Nascimento'}
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="text-gray-400" size={18} />
                    </div>
                    <input
                        type="date"
                        {...register('foundationDate')}
                        className="w-full pl-10 border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>
    </div>

    {/* Seção 2: Contato */}
    <div className="p-6 border-b border-gray-100 bg-gray-50/30">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Phone className="text-green-500" size={20} />
            Contato
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="text-gray-400" size={18} />
                    </div>
                    <input
                        type="email"
                        {...register('email')}
                        className={`w-full pl-10 border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                    type="text"
                    {...register('phone')}
                    onChange={handlePhoneChange}
                    placeholder="(00) 0000-0000"
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <input
                    type="text"
                    {...register('whatsapp')}
                    onChange={handlePhoneChange}
                    placeholder="(00) 90000-0000"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        </div>
    </div>

    {/* Seção 3: Endereço Detalhado */}
    <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="text-red-500" size={20} />
            Endereço
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input
                    type="text"
                    {...register('cep')}
                    onChange={handleCEPChange}
                    placeholder="00000-000"
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.cep ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep.message}</p>}
            </div>
            <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Avenida / Rua</label>
                <input
                    type="text"
                    {...register('street')}
                    placeholder="Ex: Av. Paulista"
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.street ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input
                    type="text"
                    {...register('number')}
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.number ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input
                    type="text"
                    {...register('complement')}
                    placeholder="Ex: Sala 101"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <input
                    type="text"
                    {...register('neighborhood')}
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.neighborhood ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood.message}</p>}
            </div>
            <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                    type="text"
                    {...register('city')}
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                    {...register('state')}
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                >
                    <option value="">UF</option>
                    <option value="SP">SP</option>
                    <option value="RJ">RJ</option>
                    <option value="MG">MG</option>
                    <option value="RS">RS</option>
                    <option value="PR">PR</option>
                    <option value="SC">SC</option>
                    <option value="BA">BA</option>
                    {/* Outros estados... */}
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
            </div>
        </div>
    </div>

    {/* Seção 4: Redes Sociais */}
    <div className="p-6 border-b border-gray-100 bg-gray-50/30">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="text-purple-500" size={20} />
            Presença Digital
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram (URL)</label>
                <input
                    type="text"
                    {...register('instagramUrl')}
                    placeholder="https://instagram.com/..."
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.instagramUrl ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.instagramUrl && <p className="text-red-500 text-xs mt-1">{errors.instagramUrl.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook (URL)</label>
                <input
                    type="text"
                    {...register('facebookUrl')}
                    placeholder="https://facebook.com/..."
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.facebookUrl ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.facebookUrl && <p className="text-red-500 text-xs mt-1">{errors.facebookUrl.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn (URL)</label>
                <input
                    type="text"
                    {...register('linkedinUrl')}
                    placeholder="https://linkedin.com/in/..."
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.linkedinUrl ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.linkedinUrl && <p className="text-red-500 text-xs mt-1">{errors.linkedinUrl.message}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                    type="text"
                    {...register('website')}
                    placeholder="https://www.seusite.com.br"
                    className={`w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${errors.website ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
            </div>
        </div>
    </div>

    {/* Seção 5: Observações */}
    <div className="p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Observações Internas</label>
        <textarea
            {...register('notes')}
            className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Informações adicionais sobre o cliente..."
        />
    </div>

    <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-4">
        <button
            type="button"
            onClick={() => setView('list')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
            Cancelar
        </button>
        <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            <Save size={18} />
            {isSubmitting ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Salvar Cadastro')}
        </button>
    </div>
</form>
        </div >
    );
};
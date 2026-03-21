const headerHTML = `
    <header>
        <h1 class="titulo-encantado">
            <a href="/index.html" style="color: inherit; text-decoration: none;">Yonia</a>
        </h1>
        <p class="texto-encantado">arquivo de material didático (em construção)</p>
        <nav class="nav-principal">
            <a href="/index.html" class="botao botao-nav">🏠 Início</a>
            <a href="/src/arcevo/index.html" class="botao botao-nav">📚 Arquivo</a>
            <a href="/src/quizz/index.html" class="botao botao-nav">❓ Quizz</a>
            <a href="#" class="botao botao-nav">⚙️ Configurações</a>
        </nav>
    </header>
`;

document.body.insertAdjacentHTML('afterbegin', headerHTML);
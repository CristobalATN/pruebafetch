// Contador global para los bloques de episodios
let contadorBloques = 0;

// Variable global para almacenar la lista de autores
let listaAutoresGlobal = [];

// Variable global para almacenar la lista de países
let listaPaisesGlobal = [];

// Variable global para almacenar la lista de empresas productoras
let listaProductorasGlobal = [];

// Función para limpiar completamente el formulario
function limpiarFormulario() {
    console.log('Iniciando limpieza del formulario...');
    
    // Limpiar campos de entrada estándar
    const form = document.getElementById('obraForm');
    if (!form) return;
    
    // Resetear el formulario (esto maneja los campos estándar)
    form.reset();
    
    // Limpiar campos Select2
    $('select[data-select2-id]').val(null).trigger('change');
    
    // Limpiar contenedores dinámicos
    const contenedoresDinamicos = [
        'bloquesEpisodiosContainer',
        'exhibicionesContainer',
        'lineasNoSerializadasContainer'
    ];
    
    contenedoresDinamicos.forEach(id => {
        const contenedor = document.getElementById(id);
        if (contenedor) {
            console.log(`Limpiando contenedor: ${id}`);
            contenedor.innerHTML = '';
        }
    });
    
    // Reiniciar contadores
    contadorBloques = 0;
    
    // Forzar actualización de visibilidad de secciones
    const tipoFormato = document.getElementById('tipoFormato');
    if (tipoFormato) {
        console.log('Actualizando visibilidad de secciones...');
        tipoFormato.dispatchEvent(new Event('change'));
    }
    
    console.log('Formulario limpiado correctamente');
}

// Funciones globales para Select2
function createTag(params) {
    const term = params.term.trim();
    if (term === '') {
        return null;
    }
    return {
        id: term,
        text: term,
        newTag: true
    };
}

function matcher(params, data) {
    if ($.trim(params.term) === '') {
        return data;
    }
    if (data.text.toLowerCase().includes(params.term.toLowerCase())) {
        return data;
    }
    return null;
}

// Función para actualizar los selects de autores
function actualizarSelectsAutores() {
    const selects = document.querySelectorAll('.autor:not(.select2-hidden-accessible)');
    console.log('Actualizando selectores .autor:', selects.length);
    
    selects.forEach(select => {
        // Guardar el valor actual si existe
        const valorActual = select.value;
        
        // Limpiar opciones existentes excepto la primera
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Agregar las opciones ordenadas
        listaAutoresGlobal.forEach(autor => {
            const option = new Option(autor, autor);
            select.add(option);
        });
        
        // Restaurar el valor anterior si existe
        if (valorActual) {
            select.value = valorActual;
        }
        
        // Inicializar Select2 si no está inicializado
        if (!$(select).hasClass('select2-hidden-accessible')) {
            $(select).select2({
                tags: true,
                tokenSeparators: [',']
            });
        }
    });
}

// Cargar datos de autores
async function cargarAutores() {
    console.log('Iniciando carga de autores...');
    try {
        const url = 'assets/csvjson.json';
        console.log('Solicitando datos desde:', url);
        
        // Usar una ruta relativa desde la raíz del sitio
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json; charset=utf-8'
            },
            cache: 'no-cache'
        });
        
        console.log('Respuesta recibida, estado:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        // Leer la respuesta como ArrayBuffer primero
        const arrayBuffer = await response.arrayBuffer();
        console.log('Tamaño del buffer:', arrayBuffer.byteLength, 'bytes');
        
        // Convertir a cadena usando TextDecoder con UTF-8
        const decoder = new TextDecoder('utf-8');
        const responseText = decoder.decode(arrayBuffer);
        
        // Eliminar BOM si existe
        const responseData = responseText.replace(/^\uFEFF/, '');
        console.log('Primeros 100 caracteres de la respuesta:', responseData.substring(0, 100));
        
        // Intentar parsear el JSON
        let autoresData;
        try {
            autoresData = JSON.parse(responseData);
            console.log('JSON parseado correctamente');
        } catch (e) {
            console.error('Error al parsear JSON:', e);
            throw new Error('El archivo JSON no tiene un formato válido');
        }
        
        console.log('Datos de autores cargados:', autoresData.length, 'registros');
        
        if (!Array.isArray(autoresData)) {
            console.error('El formato del archivo no es un array:', autoresData);
            throw new Error('El formato del archivo no es el esperado (se esperaba un array)');
        }
        
        // Extraer solo los nombres de los autores
        const nombresAutores = [];
        autoresData.forEach(item => {
            if (item && item.Autor) {
                nombresAutores.push(item.Autor);
            } else {
                console.warn('Elemento sin propiedad Autor:', item);
            }
        });
        
        console.log('Nombres de autores extraídos:', nombresAutores.length);
        
        if (nombresAutores.length === 0) {
            console.warn('No se encontraron nombres de autores en el archivo');
            return;
        }
        
        // Ordenar los nombres alfabéticamente y almacenar globalmente
        listaAutoresGlobal = [...new Set(nombresAutores)].sort((a, b) => 
            a.localeCompare(b, 'es', {sensitivity: 'base'})
        );
        
        // Actualizar los selects existentes
        actualizarSelectsAutores();
        
        console.log('Autores cargados exitosamente');
    } catch (error) {
        console.error('Error al cargar los autores:', error);
    }
}

// Observador de mutación para detectar cuando se agregan nuevos elementos al DOM
const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
            shouldUpdate = true;
        }
    });
    
    if (shouldUpdate && listaAutoresGlobal.length > 0) {
        actualizarSelectsAutores();
    }
});

// Iniciar la observación del DOM
document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Prevenir caracteres no numéricos en campos de tipo número
    function handleNumericInput(e) {
        // Solo aplicar a inputs de tipo número o con clase 'porcentaje'
        if (e.target.type === 'number' || e.target.classList.contains('porcentaje')) {
            // Guardar la posición del cursor
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            
            // Eliminar cualquier carácter que no sea número
            let newValue = e.target.value.replace(/[^0-9]/g, '');
            
            // Manejar campo de año (id="anioProduccion")
            if (e.target.id === 'anioProduccion') {
                // Limitar a 4 dígitos
                newValue = newValue.slice(0, 4);
                
                // Validar rango de año (1900-2100)
                if (newValue.length === 4) {
                    const year = parseInt(newValue, 10);
                    if (year < 1900) newValue = '1900';
                    if (year > 2100) newValue = '2100';
                }
            } 
            // Manejar otros campos numéricos
            else if (e.target.required && newValue === '') {
                newValue = '0';
            }
            
            // Actualizar el valor
            e.target.value = newValue;
            
            // Restaurar la posición del cursor
            e.target.setSelectionRange(start, end);
        }
    }
    
    // Prevenir teclas no numéricas en campos numéricos
    function preventInvalidKeys(e) {
        // Solo aplicar a inputs de tipo número o con clase 'porcentaje'
        if (e.target.type === 'number' || e.target.classList.contains('porcentaje')) {
            // Permitir teclas de control (backspace, delete, tab, escape, enter, etc.)
            if ([8, 9, 13, 27, 46].includes(e.keyCode) || 
                // Permitir: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                (e.ctrlKey === true && [65, 67, 86, 88].includes(e.keyCode)) ||
                // Permitir: home, end, left, right, up, down
                (e.keyCode >= 35 && e.keyCode <= 40)) {
                return;
            }
            
            // Solo permitir números (0-9)
            if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        }
    }
    
    // Agregar event listeners
    document.addEventListener('keydown', preventInvalidKeys);
    document.addEventListener('input', handleNumericInput);
    
    // Inicializar Select2 para elementos select mejorados
    $('.select2').select2({
        tags: true,
        tokenSeparators: [','], // Solo usar coma como separador
        createTag: function(params) {
            // Eliminar espacios al principio y al final, pero permitirlos en el medio
            const term = $.trim(params.term);
            
            // No permitir valores vacíos
            if (term === '') {
                return null;
            }
            
            return {
                id: term,
                text: term,
                newTag: true
            };
        },
        // Permitir búsqueda con espacios
        matcher: function(params, data) {
            // Si no hay términos de búsqueda, devolver todos los resultados
            if ($.trim(params.term) === '') {
                return data;
            }
            
            // Convertir a minúsculas para búsqueda sin distinción entre mayúsculas y minúsculas
            const searchTerm = params.term.toLowerCase();
            const text = data.text.toLowerCase();
            
            // Buscar coincidencias parciales
            if (text.indexOf(searchTerm) > -1) {
                return data;
            }
            
            return null;
        }
    });

    // Show/hide sections based on formato selection
    const tipoFormato = document.getElementById('tipoFormato');
    const episodiosSection = document.getElementById('episodiosSection');
    const lineasNoSerializadasSection = document.getElementById('lineasNoSerializadasSection');
    
    function actualizarVisibilidadSecciones() {
        if (!tipoFormato) return;
        
        const valorFormato = tipoFormato.value;
        const esSerie = valorFormato === 'Serie (de televisión)' || valorFormato === 'Telenovela' || 
                      valorFormato === 'Culebrón / Serie cómica' || valorFormato === 'Documentary/Factual Series' ||
                      valorFormato === 'Programa de televisión';
        
        console.log('Tipo de formato seleccionado:', valorFormato);
        console.log('¿Es serie?', esSerie);
        
        // Mostrar/ocultar secciones
        if (episodiosSection) {
            episodiosSection.style.display = esSerie ? 'block' : 'none';
            
            if (esSerie) {
                // Si es una serie, verificar si ya hay bloques
                const bloquesContainer = document.getElementById('bloquesEpisodiosContainer');
                if (bloquesContainer && bloquesContainer.children.length === 0) {
                    console.log('Agregando bloque de episodio por defecto');
                    // Agregar un bloque de episodios automáticamente
                    addBloqueEpisodios();
                }
            } else {
                // Si no es serie, limpiar los bloques de episodios
                const bloquesContainer = document.getElementById('bloquesEpisodiosContainer');
                if (bloquesContainer) {
                    console.log('Limpiando bloques de episodios');
                    bloquesContainer.innerHTML = '';
                    contadorBloques = 0; // Reiniciar el contador de bloques
                }
            }
        }
        
        if (lineasNoSerializadasSection) {
            const mostrarLineasNoSerializadas = !esSerie;
            lineasNoSerializadasSection.style.display = mostrarLineasNoSerializadas ? 'block' : 'none';
            
            // Si es serie, limpiar el contenedor de líneas no serializadas
            if (esSerie) {
                const lineasContainer = document.getElementById('lineasNoSerializadasContainer');
                if (lineasContainer) {
                    console.log('Limpiando líneas no serializadas');
                    lineasContainer.innerHTML = '';
                }
            }
        }
    }
    
    // Configurar el evento change
    if (tipoFormato) {
        tipoFormato.addEventListener('change', actualizarVisibilidadSecciones);
        // Ejecutar una vez al cargar para establecer el estado inicial
        actualizarVisibilidadSecciones();
    }

    // Add exhibicion
    const addExhibicionBtn = document.getElementById('addExhibicion');
    const exhibicionesContainer = document.getElementById('exhibicionesContainer');
    
    if (addExhibicionBtn && exhibicionesContainer) {
        addExhibicionBtn.addEventListener('click', function() {
            addExhibicion();
        });
    }

    // Add bloque de episodios
    const addBloqueEpisodiosBtn = document.getElementById('addBloqueEpisodios');
    const bloquesEpisodiosContainer = document.getElementById('bloquesEpisodiosContainer');
    
    if (addBloqueEpisodiosBtn && bloquesEpisodiosContainer) {
        addBloqueEpisodiosBtn.addEventListener('click', function() {
            addBloqueEpisodios();
        });
    }

    // Validar que solo se ingresen números en los campos de porcentaje
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('porcentaje')) {
            // Eliminar cualquier carácter que no sea número o punto decimal
            let value = e.target.value.replace(/[^0-9.]/g, '');
            
            // Asegurarse de que solo haya un punto decimal
            const decimalCount = (value.match(/\./g) || []).length;
            if (decimalCount > 1) {
                value = value.substring(0, value.lastIndexOf('.'));
            }
            
            // Limitar a 2 decimales
            const parts = value.split('.');
            if (parts[1] && parts[1].length > 2) {
                value = `${parts[0]}.${parts[1].substring(0, 2)}`;
            }
            
            // Asegurarse de que el valor esté entre 0 y 100
            const numValue = parseFloat(value || 0);
            if (numValue > 100) {
                value = '100';
            } else if (numValue < 0) {
                value = '0';
            }
            
            // Actualizar el valor si cambió
            if (e.target.value !== value) {
                e.target.value = value;
            }
        }
    });
    
        // Cargar la lista de autores
    cargarAutores();
    
    // Cargar la lista de países
    cargarPaises();
    
    // Cargar la lista de empresas productoras
    cargarProductoras();
});

// Add a new exhibicion
function addExhibicion() {
    const exhibicionesContainer = document.getElementById('exhibicionesContainer');
    if (!exhibicionesContainer) return;
    
    const template = document.getElementById('exhibicionTemplate');
    if (!template) return;
    
    const clone = template.content.cloneNode(true);
    const exhibicionItem = clone.querySelector('.exhibicion-item');
    
    // Add remove button functionality
    const removeBtn = exhibicionItem.querySelector('.btn-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            exhibicionItem.remove();
        });
    }
    
    // Agregar el ítem al contenedor
    exhibicionesContainer.appendChild(exhibicionItem);
    
    // Inicializar Select2 para el campo de canal
    const canalSelect = exhibicionItem.querySelector('.canalExhibicion');
    if (canalSelect) {
        $(canalSelect).select2({
            tags: true,
            placeholder: 'Ingrese el nombre del canal o plataforma...',
            allowClear: true,
            createTag: function(params) {
                const term = $.trim(params.term);
                if (term === '') return null;
                return {
                    id: term,
                    text: term,
                    newTag: true
                };
            }
        });
    }
    
    // Inicializar Select2 para el campo de idioma de exhibición
    const idiomaSelect = exhibicionItem.querySelector('.idiomaExhibicion');
    if (idiomaSelect) {
        // Limpiar opciones existentes
        idiomaSelect.innerHTML = '<option value="">Seleccione un idioma...</option>';
        
        // Agregar idiomas al select
        listaIdeomasGlobal.forEach(idioma => {
            const option = document.createElement('option');
            option.value = idioma;
            option.textContent = idioma;
            idiomaSelect.appendChild(option);
        });
        
        // Inicializar Select2
        $(idiomaSelect).select2({
            placeholder: 'Seleccione un idioma...',
            allowClear: true,
            width: '100%',
            matcher: function(params, data) {
                if ($.trim(params.term) === '') return data;
                const searchTerm = params.term.toLowerCase();
                const text = data.text.toLowerCase();
                if (text.indexOf(searchTerm) > -1) return data;
                return null;
            }
        });
    }
    
    // Inicializar Select2 para el campo de país de exhibición
    const paisSelect = exhibicionItem.querySelector('.paisExhibicion');
    if (paisSelect) {
        // Cargar países en el select
        cargarPaises().then(paises => {
            // Limpiar opciones existentes
            paisSelect.innerHTML = '<option value="">Seleccione o busque un país...</option>';
            
            // Agregar países al select
            paises.forEach(pais => {
                const option = document.createElement('option');
                option.value = pais;
                option.textContent = pais;
                paisSelect.appendChild(option);
            });
            
            // Inicializar Select2
            $(paisSelect).select2({
                placeholder: 'Seleccione o busque un país...',
                allowClear: true,
                tags: true,
                createTag: function(params) {
                    const term = $.trim(params.term);
                    if (term === '') return null;
                    return {
                        id: term,
                        text: term,
                        newTag: true
                    };
                },
                matcher: function(params, data) {
                    if ($.trim(params.term) === '') return data;
                    const searchTerm = params.term.toLowerCase();
                    const text = data.text.toLowerCase();
                    if (text.indexOf(searchTerm) > -1) return data;
                    return null;
                }
            });
        }).catch(error => {
            console.error('Error al cargar países para exhibición:', error);
            // Inicializar Select2 sin opciones en caso de error
            $(paisSelect).select2({
                placeholder: 'Error al cargar países',
                allowClear: true,
                tags: true
            });
        });
    }
}

// Add a new bloque de episodios
function addBloqueEpisodios() {
    const bloquesContainer = document.getElementById('bloquesEpisodiosContainer');
    if (!bloquesContainer) return;
    
    const template = document.getElementById('bloqueEpisodiosTemplate');
    if (!template) return;
    
    // Incrementar el contador de bloques
    contadorBloques++;
    
    const clone = template.content.cloneNode(true);
    const bloqueEpisodios = clone.querySelector('.bloque-episodios');
    
    // Actualizar el título del bloque con el número correspondiente
    const tituloBloque = bloqueEpisodios.querySelector('.bloque-header h3');
    if (tituloBloque) {
        tituloBloque.textContent = `Bloque de Episodios #${contadorBloques}`;
    }
    
    // Add remove button functionality
    const removeBtn = bloqueEpisodios.querySelector('.btn-remove');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            if (confirm('¿Está seguro de eliminar este bloque de episodios?')) {
                // Eliminar el bloque
                bloqueEpisodios.remove();
                
                // Verificar si quedan bloques
                const bloquesRestantes = document.querySelectorAll('.bloque-episodios').length;
                console.log('Bloques restantes después de eliminar:', bloquesRestantes);
                
                // Si no quedan bloques, reiniciar el contador
                if (bloquesRestantes === 0) {
                    contadorBloques = 0;
                    console.log('Se reinició el contador de bloques a 0');
                }
            }
        });
    }
    
    // Add event listeners for desde/hasta episodio
    const desdeEpisodio = bloqueEpisodios.querySelector('.desdeEpisodio');
    const hastaEpisodio = bloqueEpisodios.querySelector('.hastaEpisodio');
    
    function updateEpisodios() {
        const desde = parseInt(desdeEpisodio.value) || 0;
        const hasta = parseInt(hastaEpisodio.value) || 0;
        
        // Limpiar contenedor de episodios individuales
        const individuales = bloqueEpisodios.querySelector('.episodios-individuales');
        if (individuales) individuales.innerHTML = '';
        
        // Generar solo la vista individual si los valores son válidos
        if (desde > 0 && hasta >= desde) {
            generateEpisodiosIndividuales(bloqueEpisodios, desde, hasta);
        }
    }
    
    if (desdeEpisodio) {
        desdeEpisodio.addEventListener('change', updateEpisodios);
        desdeEpisodio.addEventListener('blur', updateEpisodios);
    }
    
    if (hastaEpisodio) {
        hastaEpisodio.addEventListener('change', updateEpisodios);
        hastaEpisodio.addEventListener('blur', updateEpisodios);
    }
    
    // Mostrar la vista individual por defecto
    const individuales = bloqueEpisodios.querySelector('.episodios-individuales');
    if (individuales) {
        individuales.style.display = 'block';
    }
    
    // Configurar el botón de agregar línea de participación
    const addLineaBtn = bloqueEpisodios.querySelector('.btn-add-linea');
    if (addLineaBtn) {
        // Usar event delegation para manejar los clics en los botones de agregar línea
        bloqueEpisodios.addEventListener('click', function(e) {
            if (e.target && e.target.classList.contains('btn-add-linea')) {
                e.preventDefault();
                e.stopPropagation();
                addLineaParticipacion(e.target);
                return false;
            }
        });
    }
    
    // Agregar el bloque al contenedor
    bloquesContainer.appendChild(bloqueEpisodios);
    
    // Inicializar selectores de autor en este bloque
    const autorSelects = bloqueEpisodios.querySelectorAll('.autor');
    autorSelects.forEach(select => {
        // Si ya hay autores cargados, poblar el select
        if (listaAutoresGlobal.length > 0) {
            // Guardar el valor actual si existe
            const valorActual = select.value;
            
            // Limpiar opciones existentes excepto la primera
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            // Agregar las opciones ordenadas
            listaAutoresGlobal.forEach(autor => {
                const option = new Option(autor, autor);
                select.add(option);
            });
            
            // Restaurar el valor anterior si existe
            if (valorActual) {
                select.value = valorActual;
            }
        }
        
        // Inicializar Select2
        $(select).select2({
            tags: true,
            tokenSeparators: [',', ' '],
            createTag: function(params) {
                const term = $.trim(params.term);
                if (term === '') return null;
                return {
                    id: term,
                    text: term,
                    newTag: true
                };
            },
            matcher: function(params, data) {
                if ($.trim(params.term) === '') return data;
                const searchTerm = params.term.toLowerCase();
                const text = data.text.toLowerCase();
                return text.indexOf(searchTerm) > -1 ? data : null;
            }
        });
    });
    
    // Inicializar otros selectores Select2 en el bloque (no autores)
    $(bloqueEpisodios).find('select:not(.autor)').each(function() {
        if (!$(this).hasClass('select2-hidden-accessible')) {
            $(this).select2({
                tags: true,
                tokenSeparators: [',', ' '],
                createTag: function(params) {
                    const term = $.trim(params.term);
                    if (term === '') return null;
                    return { id: term, text: term, newTag: true };
                },
                matcher: function(params, data) {
                    if ($.trim(params.term) === '') return data;
                    const searchTerm = params.term.toLowerCase();
                    const text = data.text.toLowerCase();
                    return text.indexOf(searchTerm) > -1 ? data : null;
                }
            });
        }
    });
    
    // Trigger initial update
    updateEpisodios();
}

// Generate episodios individuales
function generateEpisodiosIndividuales(container, desde, hasta) {
    const containerDiv = container.querySelector('.episodios-individuales');
    if (!containerDiv) return;
    
    containerDiv.innerHTML = '';
    
    for (let i = desde; i <= hasta; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label for="episodio-${i}">Episodio ${i}</label>
            <input type="text" id="episodio-${i}" class="titulo-episodio" data-episodio="${i}" placeholder="Título del episodio ${i}">
        `;
        containerDiv.appendChild(div);
    }
}

// Add linea de participación
function addLineaParticipacion(button) {
    if (!button) {
        console.error('No se proporcionó un botón válido');
        return;
    }
    
    // Buscar el contenedor de líneas de participación más cercano
    const subbloque = button.closest('.subbloque');
    if (!subbloque) {
        console.error('No se encontró el subbloque de participación');
        return;
    }
    
    const container = subbloque.querySelector('.lineas-participacion');
    if (!container) {
        console.error('No se encontró el contenedor de líneas de participación');
        return;
    }
    
    console.log('Agregando línea de participación al contenedor:', container);
    addLineaParticipacionToContainer(container);
}

// Función para agregar línea de participación a un contenedor específico
function addLineaParticipacionToContainer(container) {
    const template = document.getElementById('lineaParticipacionTemplate');
    
    if (template && container) {
        const newLine = document.importNode(template.content, true);
        
        // Configurar el select de roles
        const rolSelect = newLine.querySelector('.rol');
        if (rolSelect) {
            // Limpiar opciones existentes
            rolSelect.innerHTML = '';
            
            // Usar roles cargados o los predeterminados
            const roles = listaRolesGlobal.length > 0 ? listaRolesGlobal : 
                ['Director', 'Guionista', 'Actor', 'Productor', 'Músico', 'Fotógrafo'];
                
            // Agregar opción vacía
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Seleccione un rol...';
            rolSelect.appendChild(emptyOption);
            
            // Agregar roles
            roles.forEach(rol => {
                const option = document.createElement('option');
                option.value = rol;
                option.textContent = rol;
                rolSelect.appendChild(option);
            });
            
            // Inicializar Select2 para el select de roles (selección única)
            $(rolSelect).select2({
                placeholder: 'Seleccione un rol',
                allowClear: true,
                tags: false,
                multiple: false,
                createTag: function(params) {
                    // No permitir crear nuevos tags
                    return null;
                }
            });
        }
        
        // Agregar la línea al contenedor primero para que el DOM esté listo
        container.appendChild(newLine);
        
        // Configurar el select de autores después de agregar al DOM
        const autorSelect = container.querySelector('.linea-participacion:last-child .autor');
        if (autorSelect) {
            // Asegurarse de que los datos de autores estén cargados
            if (listaAutoresGlobal.length === 0) {
                cargarAutores();
            } else {
                // Limpiar opciones existentes
                autorSelect.innerHTML = '';
                
                // Agregar opción vacía
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = 'Seleccione un autor...';
                autorSelect.appendChild(emptyOption);
                
                // Agregar autores
                listaAutoresGlobal.forEach(autor => {
                    const option = document.createElement('option');
                    option.value = autor;
                    option.textContent = autor;
                    autorSelect.appendChild(option);
                });
                
                // Inicializar Select2
                $(autorSelect).select2({
                    tags: true,
                    createTag: createTag,
                    matcher: matcher,
                    placeholder: 'Seleccione o ingrese un autor',
                    allowClear: true
                });
            }
        }
        
        // Agregar manejador de eventos para el botón de eliminar
        const removeBtn = container.querySelector('.linea-participacion:last-child .remove-linea');
        if (removeBtn) {
            removeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const linea = this.closest('.linea-participacion');
                if (linea) {
                    // Destruir Select2 antes de eliminar
                    const autorSelect = linea.querySelector('.autor');
                    if (autorSelect && autorSelect.select2) {
                        $(autorSelect).select2('destroy');
                    }
                    linea.remove();
                }
            });
        }
    }
}

// Función para agregar línea de participación no serializada
function addLineaParticipacionNoSerializada() {
    const container = document.getElementById('lineasNoSerializadasContainer');
    if (!container) {
        console.error('No se encontró el contenedor de líneas no serializadas');
        return;
    }
    
    // Usar el contenedor directamente sin buscar un contenedor interno
    addLineaParticipacionToContainer(container);
}

// Remove linea de participación
function removeLineaParticipacion(button) {
    const linea = button.closest('.linea-participacion');
    if (linea) {
        linea.remove();
    }
}

// URL de la API de Power Automate
const POWER_AUTOMATE_URL = 'https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/b4efa70c80654ec488236ec10a4fb4b4/triggers/manual/paths/invoke';
const POWER_AUTOMATE_PARAMS = {
    'api-version': '1',
    'tenantId': 'tId',
    'environmentName': 'Default-0c130962-09bc-40fc-8db8-9d043ff6251a',
    'sp': '/triggers/manual/run',
    'sv': '1.0',
    'sig': 'F1kVR1aS2F84dre8fnUgdPwgBO1UK4uxCl4BIASpkRg'
};

// Función para mostrar mensajes al usuario
function showMessage(message, isError = false) {
    // Eliminar mensajes anteriores
    const existingMessage = document.getElementById('form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Crear y mostrar el nuevo mensaje
    const messageDiv = document.createElement('div');
    messageDiv.id = 'form-message';
    messageDiv.className = `message ${isError ? 'error' : 'success'}`;
    messageDiv.textContent = message;
    
    // Insertar el mensaje después del formulario
    const form = document.getElementById('obraForm');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form.nextSibling);
    } else {
        document.body.appendChild(messageDiv);
    }
    
    // Desaparecer después de 5 segundos
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 500);
    }, 5000);
}

// Función para cargar la lista de idiomas
let listaIdeomasGlobal = [];

async function cargarIdiomas() {
    try {
        const response = await fetch('assets/idioma.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar la lista de idiomas');
        }
        const data = await response.json();
        listaIdeomasGlobal = data.map(item => item.Idioma);
        console.log('Idiomas cargados:', listaIdeomasGlobal);
        
        // Actualizar los selects de idioma
        actualizarSelectsIdiomas();
        
        return listaIdeomasGlobal;
    } catch (error) {
        console.error('Error al cargar los idiomas:', error);
        // Valores por defecto en caso de error
        listaIdeomasGlobal = [
            'Español', 
            'Inglés', 
            'Francés', 
            'Alemán', 
            'Italiano', 
            'Portugués',
            'Chino',
            'Japonés',
            'Ruso',
            'Árabe'
        ];
        
        // Actualizar los selects de idioma con valores por defecto
        actualizarSelectsIdiomas();
        
        return listaIdeomasGlobal;
    }
}

// Función para actualizar los selects de idioma en el formulario
function actualizarSelectsIdiomas() {
    // Actualizar el select de idioma principal
    const selectIdioma = document.getElementById('idioma');
    if (selectIdioma) {
        // Guardar el valor seleccionado actual
        const valorActual = selectIdioma.value;
        
        // Limpiar opciones existentes
        selectIdioma.innerHTML = '<option value="">Seleccione un idioma...</option>';
        
        // Agregar idiomas
        listaIdeomasGlobal.forEach(idioma => {
            const option = document.createElement('option');
            option.value = idioma;
            option.textContent = idioma;
            selectIdioma.appendChild(option);
        });
        
        // Restaurar el valor seleccionado si existe
        if (valorActual) {
            selectIdioma.value = valorActual;
        }
    }
    
    // Actualizar los selects de idioma en las exhibiciones existentes
    document.querySelectorAll('.idiomaExhibicion').forEach(select => {
        // Solo actualizar si no es un Select2 ya inicializado
        if (!select.classList.contains('select2-hidden-accessible')) {
            const valorActual = select.value;
            
            // Limpiar opciones existentes
            select.innerHTML = '<option value="">Seleccione un idioma...</option>';
            
            // Agregar idiomas
            listaIdeomasGlobal.forEach(idioma => {
                const option = document.createElement('option');
                option.value = idioma;
                option.textContent = idioma;
                select.appendChild(option);
            });
            
            // Restaurar el valor seleccionado si existe
            if (valorActual) {
                select.value = valorActual;
            }
        }
    });
}

// Función para cargar la lista de roles
let listaRolesGlobal = [];

async function cargarRoles() {
    try {
        const response = await fetch('assets/rol.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar la lista de roles');
        }
        const data = await response.json();
        listaRolesGlobal = data.map(item => item.Rol);
        console.log('Roles cargados:', listaRolesGlobal);
        return listaRolesGlobal;
    } catch (error) {
        console.error('Error al cargar los roles:', error);
        // Valores por defecto en caso de error
        listaRolesGlobal = [
            'Director', 
            'Guionista', 
            'Actor', 
            'Productor', 
            'Músico', 
            'Fotógrafo'
        ];
        return listaRolesGlobal;
    }
}

// Llamar a las funciones de carga cuando se cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
    cargarRoles();
    cargarIdiomas();
});

// Función para cargar la lista de empresas productoras
function cargarProductoras() {
    // Mostrar indicador de carga
    const selectProductora = document.getElementById('empresaProductora');
    if (selectProductora) {
        const loadingOption = new Option('Cargando empresas...', '', true, true);
        loadingOption.disabled = true;
        selectProductora.innerHTML = '';
        selectProductora.add(loadingOption);
    }

    return fetch('assets/productoras.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar la lista de empresas productoras');
            }
            return response.json();
        })
        .then(productoras => {
            // Guardar la lista de productoras globalmente
            listaProductorasGlobal = productoras.map(p => p.Productora);
            
            // Ordenar productoras alfabéticamente (ignorando mayúsculas y tildes)
            const collator = new Intl.Collator('es', {sensitivity: 'base'});
            const productorasOrdenadas = [...listaProductorasGlobal].sort(collator.compare);
            
            // Actualizar el select
            if (selectProductora) {
                // Limpiar opciones existentes
                selectProductora.innerHTML = '';
                
                // Agregar productoras al select
                productorasOrdenadas.forEach(productora => {
                    const option = new Option(productora, productora);
                    selectProductora.add(option);
                });
                
                // Inicializar Select2 si no está ya inicializado
                if (!$(selectProductora).hasClass('select2-hidden-accessible')) {
                    $(selectProductora).select2({
                        placeholder: 'Seleccione o agregue empresas...',
                        allowClear: true,
                        multiple: true,
                        tags: true,
                        createTag: function(params) {
                            const term = $.trim(params.term);
                            if (term === '') {
                                return null;
                            }
                            return {
                                id: term,
                                text: term,
                                newTag: true
                            };
                        },
                        matcher: function(params, data) {
                            // Si no hay término de búsqueda, mostrar todos los resultados
                            if ($.trim(params.term) === '') {
                                return data;
                            }
                            
                            // Normalizar términos para búsqueda sin distinción de mayúsculas ni tildes
                            const normalize = text => 
                                text.toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '');
                            
                            const searchTerm = normalize(params.term);
                            const text = normalize(data.text);
                            
                            // Buscar coincidencias parciales
                            if (text.includes(searchTerm)) {
                                return data;
                            }
                            
                            return null;
                        }
                    });
                }
            }
            
            return productorasOrdenadas;
        })
        .catch(error => {
            console.error('Error al cargar empresas productoras:', error);
            showMessage('Error al cargar la lista de empresas productoras. Por favor, intente más tarde.', true);
            
            // Restaurar opción por defecto en caso de error
            if (selectProductora) {
                selectProductora.innerHTML = '';
                const defaultOption = new Option('Error al cargar empresas', '', true, true);
                defaultOption.disabled = true;
                selectProductora.add(defaultOption);
                
                // Permitir escribir manualmente
                const manualOption = new Option('Escribir manualmente...', 'manual', false, false);
                selectProductora.add(manualOption);
            }
            
            return [];
        });
}

// Función para cargar la lista de países
function cargarPaises() {
    // Mostrar indicador de carga
    const selectPais = document.getElementById('paisProduccion');
    if (selectPais) {
        const loadingOption = new Option('Cargando países...', '', true, true);
        loadingOption.disabled = true;
        selectPais.innerHTML = '';
        selectPais.add(loadingOption);
    }

    return fetch('assets/paises.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar la lista de países');
            }
            return response.json();
        })
        .then(paises => {
            // Guardar la lista de países globalmente
            listaPaisesGlobal = paises.map(pais => pais.País);
            
            // Ordenar países alfabéticamente (ignorando mayúsculas y tildes)
            const collator = new Intl.Collator('es', {sensitivity: 'base'});
            const paisesOrdenados = [...listaPaisesGlobal].sort(collator.compare);
            
            // Actualizar el select
            if (selectPais) {
                // Limpiar opciones existentes
                selectPais.innerHTML = '';
                
                // Agregar países al select
                paisesOrdenados.forEach(pais => {
                    const option = new Option(pais, pais);
                    selectPais.add(option);
                });
                
                // Inicializar Select2 si no está ya inicializado
                if (!$(selectPais).hasClass('select2-hidden-accessible')) {
                    $(selectPais).select2({
                        placeholder: 'Seleccione o agregue países...',
                        allowClear: true,
                        multiple: true,
                        tags: true,
                        createTag: function(params) {
                            const term = $.trim(params.term);
                            if (term === '') {
                                return null;
                            }
                            return {
                                id: term,
                                text: term,
                                newTag: true
                            };
                        },
                        matcher: function(params, data) {
                            // Si no hay término de búsqueda, mostrar todos los resultados
                            if ($.trim(params.term) === '') {
                                return data;
                            }
                            
                            // Normalizar términos para búsqueda sin distinción de mayúsculas ni tildes
                            const normalize = text => 
                                text.toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '');
                            
                            const searchTerm = normalize(params.term);
                            const text = normalize(data.text);
                            
                            // Buscar coincidencias parciales
                            if (text.includes(searchTerm)) {
                                return data;
                            }
                            
                            return null;
                        }
                    });
                }
            }
            
            return paisesOrdenados;
        })
        .catch(error => {
            console.error('Error al cargar países:', error);
            showMessage('Error al cargar la lista de países. Por favor, intente más tarde.', true);
            
            // Restaurar opción por defecto en caso de error
            if (selectPais) {
                selectPais.innerHTML = '';
                const defaultOption = new Option('Error al cargar países', '', true, true);
                defaultOption.disabled = true;
                selectPais.add(defaultOption);
                
                // Permitir escribir manualmente
                const manualOption = new Option('Escribir manualmente...', 'manual', false, false);
                selectPais.add(manualOption);
            }
            
            return [];
        });
}

// Función para obtener el valor de un elemento de forma segura
function getElementValue(id, defaultValue = '') {
    const element = document.getElementById(id);
    if (!element) return defaultValue;
    
    // Manejar campos de selección múltiple (Select2)
    if ($(element).hasClass('select2-hidden-accessible') && $(element).prop('multiple')) {
        return $(element).select2('data').map(item => item.text);
    }
    
    // Para campos normales
    return element.value || defaultValue;
}

// Función para convertir un valor a string, manejando arrays
function valueToString(value) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }
    return value || '';
}

// Función para recopilar los datos del formulario en formato JSON
function collectFormData() {
    try {
        // Obtener valores con manejo de arrays para selecciones múltiples
        const empresaProductora = getElementValue('empresaProductora');
        const paisProduccion = getElementValue('paisProduccion');
        
        // Datos generales con manejo de elementos nulos
        const generalData = {
            titulo_original: getElementValue('tituloOriginal'),
            tipo_formato: getElementValue('tipoFormato'),
            empresa_productora: valueToString(empresaProductora),
            pais_produccion: valueToString(paisProduccion),
            anio_produccion: getElementValue('anioProduccion'),
            idioma: getElementValue('idioma'),
            actores: getElementValue('actores'),
            directores: getElementValue('directores'),
            guionistas: getElementValue('guionistas'),
            fecha_envio: new Date().toISOString()
        };
        
        // Datos de exhibiciones
        const exhibiciones = [];
        document.querySelectorAll('.exhibicion-item').forEach((item, index) => {
            const num = index + 1;
            const exhibicion = {
                [`otro_titulo_${num}`]: item.querySelector('.otroTitulo')?.value || '',
                [`idioma_exhibicion_${num}`]: item.querySelector('.idiomaExhibicion')?.value || '',
                [`pais_exhibicion_${num}`]: item.querySelector('.paisExhibicion')?.value || '',
                [`canal_${num}`]: item.querySelector('.canalExhibicion')?.value || ''
            };
            // Solo agregar si hay al menos un campo con valor
            if (Object.values(exhibicion).some(val => val)) {
                exhibiciones.push(exhibicion);
            }
        });
        
        // Crear la primera fila con solo datos generales y exhibiciones
        const primeraFila = { ...generalData };
        
        // Agregar exhibiciones a la primera fila
        exhibiciones.forEach((exhib, index) => {
            Object.assign(primeraFila, exhib);
        });
        
        // Verificar si hay bloques de episodios
        const bloquesEpisodios = document.querySelectorAll('.bloque-episodios');
        const resultados = [];
        
        // Siempre agregar la fila maestra como primera fila
        resultados.push(primeraFila);
        
        // Si no hay bloques de episodios, verificar si hay líneas de participación no serializadas
        if (bloquesEpisodios.length === 0) {
            console.log('Buscando líneas de participación no serializadas...');
            // Obtener líneas de participación no serializadas
            const lineasNoSerializadas = [];
            const lineasContainer = document.getElementById('lineasNoSerializadasContainer');
            
            if (lineasContainer) {
                console.log('Contenedor de líneas no serializadas encontrado');
                
                // Buscar líneas directamente en el contenedor
                const lineas = lineasContainer.querySelectorAll('.linea-participacion');
                console.log(`Se encontraron ${lineas.length} líneas de participación`);
                
                lineas.forEach((linea, index) => {
                    const rolSelect = linea.querySelector('.rol');
                    const rol = rolSelect ? rolSelect.value : '';
                    
                    const autorSelect = linea.querySelector('.autor');
                    const autor = autorSelect ? autorSelect.value : '';
                    
                    const porcentajeInput = linea.querySelector('.porcentaje');
                    const porcentaje = porcentajeInput ? porcentajeInput.value : '';
                    
                    console.log(`Línea ${index + 1}:`, { rol, autor, porcentaje });
                    
                    if (rol && autor && porcentaje) {
                        lineasNoSerializadas.push({ rol, autor, porcentaje });
                    }
                });
                
                // Si hay líneas de participación, agregarlas a los resultados
                if (lineasNoSerializadas.length > 0) {
                    console.log(`Agregando ${lineasNoSerializadas.length} líneas no serializadas a los resultados`);
                    lineasNoSerializadas.forEach(linea => {
                        const filaNoSerializada = { ...primeraFila };
                        filaNoSerializada.rol = linea.rol;
                        filaNoSerializada.autor = linea.autor;
                        filaNoSerializada.porcentaje = linea.porcentaje;
                        resultados.push(filaNoSerializada);
                    });
                } else {
                    console.log('No se encontraron líneas de participación válidas');
                }
            } else {
                console.log('No se encontró el contenedor de líneas no serializadas');
            }
            
            return resultados;
        }
        
        // Procesar bloques de episodios
        bloquesEpisodios.forEach((bloque) => {
            const desde = parseInt(bloque.querySelector('.desdeEpisodio')?.value) || 1;
            const hasta = parseInt(bloque.querySelector('.hastaEpisodio')?.value) || 1;
            const temporada = bloque.querySelector('.temporada')?.value || '1';
            
            console.log(`Procesando bloque: temporada ${temporada}, episodios ${desde} a ${hasta}`);
            
            // Obtener títulos de episodios
            const titulos = {};
            bloque.querySelectorAll('.titulo-episodio').forEach(input => {
                const num = input.getAttribute('data-episodio');
                if (num) {
                    titulos[num] = input.value;
                    console.log(`Título para episodio ${num}:`, input.value);
                }
            });
            
            // Obtener líneas de participación
            const lineas = [];
            const lineasContainer = bloque.querySelector('.lineas-participacion');
            if (lineasContainer) {
                lineasContainer.querySelectorAll('.linea-participacion').forEach(linea => {
                    const rolSelect = linea.querySelector('.rol');
                    const rol = rolSelect ? rolSelect.value : '';
                    const autorSelect = linea.querySelector('.autor');
                    const autor = autorSelect ? autorSelect.value : '';
                    const porcentajeInput = linea.querySelector('.porcentaje');
                    const porcentaje = porcentajeInput ? porcentajeInput.value : '';
                    
                    console.log('Línea encontrada:', {rol, autor, porcentaje});
                    
                    if (rol && autor && porcentaje) {
                        lineas.push({ rol, autor, porcentaje });
                    }
                });
            }
            
            console.log(`Líneas de participación encontradas:`, lineas);
            
            // Crear una entrada por cada episodio y línea de participación
            if (lineas.length > 0) {
                for (let i = desde; i <= hasta; i++) {
                    lineas.forEach(linea => {
                        const filaEpisodio = {
                            ...primeraFila, // Incluir todos los datos generales
                            temporada: temporada,
                            num_episodio: i,
                            titulo_episodio: titulos[i.toString()] || `Episodio ${i}`,
                            rol: linea.rol,
                            autor: linea.autor,
                            porcentaje: linea.porcentaje
                        };
                        
                        console.log('Agregando fila de episodio:', filaEpisodio);
                        resultados.push(filaEpisodio);
                    });
                }
            } else {
                // Si no hay líneas de participación, crear una entrada por episodio igualmente
                for (let i = desde; i <= hasta; i++) {
                    const filaEpisodio = {
                        ...primeraFila,
                        temporada: temporada,
                        num_episodio: i,
                        titulo_episodio: titulos[i.toString()] || `Episodio ${i}`
                    };
                    console.log('Agregando fila de episodio sin líneas:', filaEpisodio);
                    resultados.push(filaEpisodio);
                }
            }
        });
        
        return resultados;
    } catch (error) {
        console.error('Error al recopilar datos del formulario:', error);
        showMessage('Error al procesar los datos del formulario', true);
        throw error; // Relanzar el error para manejarlo en submitFormData
    }
}

// Función para validar los porcentajes de participación por rol
function validarPorcentajesParticipacion() {
    const porcentajesPorRol = {};
    const errores = [];
    
    // Obtener todas las líneas de participación (tanto en bloques de episodios como en no serializadas)
    const lineasParticipacion = document.querySelectorAll('.linea-participacion');
    
    // Procesar cada línea de participación
    lineasParticipacion.forEach((linea, index) => {
        const rolSelect = linea.querySelector('.rol');
        const porcentajeInput = linea.querySelector('.porcentaje');
        
        if (rolSelect && porcentajeInput) {
            const rol = rolSelect.value;
            const porcentaje = parseFloat(porcentajeInput.value) || 0;
            
            if (rol) {
                if (!porcentajesPorRol[rol]) {
                    porcentajesPorRol[rol] = 0;
                }
                porcentajesPorRol[rol] += porcentaje;
            }
        }
    });
    
    // Verificar si algún rol supera el 100%
    for (const [rol, total] of Object.entries(porcentajesPorRol)) {
        if (total > 100) {
            errores.push(`La suma de porcentaje para el rol ${rol} supera el 100% (${total.toFixed(2)}%).`);
        }
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// Función para verificar si hay al menos una línea de participación
function tieneLineasDeParticipacion() {
    // Verificar en bloques de episodios
    const lineasEnBloques = document.querySelectorAll('.bloque-episodios .linea-participacion').length > 0;
    
    // Verificar en sección de no serializados
    const lineasNoSerializadas = document.querySelectorAll('#lineasNoSerializadasContainer .linea-participacion').length > 0;
    
    return lineasEnBloques || lineasNoSerializadas;
}

// Función para mostrar mensaje de error de validación
function mostrarErrorValidacion(mensaje) {
    // Usar SweetAlert2 si está disponible, de lo contrario usar alert nativo
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    } else {
        alert(mensaje);
    }
}

// Función para mostrar errores de validación
function mostrarErroresValidacion(errores) {
    // Usar SweetAlert2 si está disponible, de lo contrario usar alert nativo
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Error de validación',
            html: errores.join('<br><br>'),
            icon: 'error',
            confirmButtonText: 'Entendido'
        });
    } else {
        alert(errores.join('\n\n'));
    }
}

// Función para enviar los datos al servidor
async function submitFormData(event) {
    event.preventDefault();

    // Verificar si hay al menos una línea de participación
    if (!tieneLineasDeParticipacion()) {
        mostrarErrorValidacion('Debe agregar al menos una línea de participación antes de enviar el formulario.');
        return;
    }

    // Validar porcentajes de participación
    const validacion = validarPorcentajesParticipacion();
    if (!validacion.valido) {
        mostrarErroresValidacion(validacion.errores);
        return;
    }

    const submitButton = document.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : 'Enviar';

    try {
        // Mostrar indicador de carga
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
        }
        
        // Recopilar datos del formulario
        const formData = collectFormData();
        
        if (formData.length === 0) {
            throw new Error('No hay datos para enviar. Por favor, complete al menos un episodio.');
        }
        
        console.log('Datos a enviar:', formData);
        
        // Construir URL con parámetros
        const url = new URL(POWER_AUTOMATE_URL);
        Object.entries(POWER_AUTOMATE_PARAMS).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        
        console.log('URL de la solicitud:', url.toString()); // Para depuración
        
        // Enviar datos al servidor
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(formData),
            mode: 'cors' // Importante para peticiones entre dominios
        });
        
        if (!response.ok) {
            let errorMessage = `Error en la respuesta del servidor: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                // Si no se puede parsear la respuesta como JSON, usar el mensaje por defecto
                console.error('No se pudo parsear la respuesta de error:', e);
            }
            throw new Error(errorMessage);
        }
        
        // Mostrar mensaje de éxito
        showMessage('¡Datos enviados correctamente!', false);
        
        // Opcional: Limpiar el formulario después de un envío exitoso
        // document.getElementById('obraForm').reset();
        
    } catch (error) {
        console.error('Error al enviar los datos:', error);
        showMessage(`Error al enviar los datos: ${error.message}`, true);
    } finally {
        // Restaurar el botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}

// Asignar el manejador de envío del formulario
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('obraForm');
    if (form) {
        // Configurar manejador para el botón de agregar línea no serializada
        const addLineaNoSerializadaBtn = document.getElementById('addLineaNoSerializada');
        if (addLineaNoSerializadaBtn) {
            addLineaNoSerializadaBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Botón de agregar línea no serializada clickeado');
                addLineaParticipacionNoSerializada();
            });
        }
        // Configurar Select2 para los selects existentes
        $('.select2').select2({
            tags: true,
            createTag: function(params) {
                const term = params.term.trim();
                if (term === '') {
                    return null;
                }
                return {
                    id: term,
                    text: term,
                    newTag: true
                };
            },
            matcher: function(params, data) {
                if ($.trim(params.term) === '') {
                    return data;
                }
                if (data.text.toLowerCase().includes(params.term.toLowerCase())) {
                    return data;
                }
                return null;
            }
        });
        
        // Manejar el envío del formulario
        form.addEventListener('submit', submitFormData);
        
        // Manejar el botón de limpiar formulario
        const limpiarBtn = form.querySelector('button[type="reset"]');
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('¿Está seguro que desea limpiar todo el formulario? Se perderán todos los datos ingresados.')) {
                    limpiarFormulario();
                }
            });
        }
    }
});

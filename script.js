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
document.addEventListener('DOMContentLoaded', function () {
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
            
            // Solo intentar restaurar la posición del cursor si no es un input de tipo 'number'
            if (e.target.type !== 'number') {
                try {
                    e.target.setSelectionRange(start, end);
                } catch (err) {
                    console.warn('No se pudo restaurar la posición del cursor:', err);
                }
            }
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
                // No agregamos bloques automáticamente, el usuario debe hacer clic en 'Agregar Bloque'
                console.log('Formato de serie seleccionado, mostrando sección de episodios');
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

    // Configurar el botón de agregar exhibición
    // El evento se configura más adelante en el código para evitar duplicados

    // Configurar el botón de agregar bloque de episodios
    // El evento se configura más adelante en el código para evitar duplicados

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
    try {
        const exhibicionesContainer = document.getElementById('exhibicionesContainer');
        if (!exhibicionesContainer) {
            console.error('No se encontró el contenedor de exhibiciones');
            return;
        }
        
        const template = document.getElementById('exhibicionTemplate');
        if (!template) {
            console.error('No se encontró la plantilla de exhibición');
            return;
        }
        
        const clone = template.content.cloneNode(true);
        const exhibicionItem = clone.querySelector('.exhibicion-item');
        if (!exhibicionItem) {
            console.error('No se pudo clonar el ítem de exhibición');
            return;
        }
        
        // Agregar el ítem al contenedor primero para que los select2 funcionen correctamente
        exhibicionesContainer.appendChild(exhibicionItem);
        
        // Agregar funcionalidad de eliminación
        const removeBtn = exhibicionItem.querySelector('.btn-remove');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                exhibicionItem.remove();
            });
        } else {
            console.warn('No se encontró el botón de eliminar en la plantilla de exhibición');
        }
        
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
        
        // Enfocar el primer campo para mejor experiencia de usuario
        const primerCampo = exhibicionItem.querySelector('input, select');
        if (primerCampo) {
            setTimeout(() => {
                primerCampo.focus();
            }, 100);
        }
    } catch (error) {
        console.error('Error al agregar exhibición:', error);
        showMessage('Ocurrió un error al agregar la exhibición. Por favor, inténtelo de nuevo.', true);
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

// Generate episodios individuales en formato de tabla con acordeones
function generateEpisodiosIndividuales(container, desde, hasta) {
    const tablaContainer = container.querySelector('.tabla-episodios-container');
    const tbody = container.querySelector('.tabla-episodios tbody');
    
    if (!tablaContainer || !tbody) return;
    
    // Limpiar la tabla
    tbody.innerHTML = '';
    
    // Generar filas de la tabla
    for (let i = desde; i <= hasta; i++) {
        const tr = document.createElement('tr');
        tr.className = 'episodio-fila';
        tr.innerHTML = `
            <td colspan="2">
                <div class="episodio-header" data-episodio="${i}">
                    <div class="episodio-header-content">
                        <span class="episodio-numero">Episodio ${i}</span>
                        <span class="episodio-titulo-preview">Sin título</span>
                        <span class="episodio-contador-titulos">0 títulos traducidos</span>
                    </div>
                    <button type="button" class="btn btn-link btn-sm toggle-episodio" data-episodio="${i}">
                        <i class="toggle-icon">▼</i>
                    </button>
                </div>
                
                <div class="episodio-content" style="display: none;" data-episodio="${i}">
                    <div class="form-group">
                        <label>Título del episodio</label>
                        <input type="text" class="form-control titulo-episodio" 
                               data-episodio="${i}" 
                               placeholder="Título del episodio ${i}">
                    </div>
                    
                    <!-- Sección de títulos alternativos -->
                    <div class="titulos-alternativos">
                        <div class="subbloque">
                            <div class="subbloque-header">
                                <h5>Otros títulos del episodio</h5>
                                <button type="button" class="btn btn-small btn-add-titulo-alternativo" data-episodio="${i}">
                                    + Agregar Título
                                </button>
                            </div>
                            <div class="titulos-alternativos-lista">
                                <!-- Los títulos alternativos se agregarán aquí -->
                            </div>
                        </div>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    }
    
    // Inicializar eventos de los episodios
    initializeEpisodioEvents(tbody);
    
    // Mostrar la tabla
    tablaContainer.style.display = 'block';
}

// Función para inicializar los eventos de los episodios
function initializeEpisodioEvents(container) {
    // Toggle para mostrar/ocultar contenido del episodio
    container.querySelectorAll('.toggle-episodio').forEach(btn => {
        btn.addEventListener('click', function() {
            const episodioNum = this.getAttribute('data-episodio');
            const episodioContent = container.querySelector(`.episodio-content[data-episodio="${episodioNum}"]`);
            const isHidden = episodioContent.style.display === 'none';
            
            episodioContent.style.display = isHidden ? 'block' : 'none';
            const icon = this.querySelector('.toggle-icon');
            icon.textContent = isHidden ? '▼' : '▶';
        });
    });
    
    // Actualizar título preview al cambiar el título del episodio
    container.querySelectorAll('.titulo-episodio').forEach(input => {
        input.addEventListener('input', function() {
            const episodioNum = this.getAttribute('data-episodio');
            const tituloPreview = container.querySelector(`.episodio-header[data-episodio="${episodioNum}"] .episodio-titulo-preview`);
            tituloPreview.textContent = this.value ? `- ${this.value}` : '';
        });
    });
    
    // Inicializar eventos de los botones de títulos alternativos
    initializeTitulosAlternativos(container);
}

// Inicializar eventos para los títulos alternativos
async function initializeTitulosAlternativos(container) {
    // Toggle para mostrar/ocultar títulos alternativos
    container.querySelectorAll('.toggle-titulos').forEach(btn => {
        btn.addEventListener('click', function() {
            const episodioNum = this.getAttribute('data-episodio');
            const titulosSection = this.closest('tr').querySelector('.titulos-alternativos');
            const isHidden = titulosSection.style.display === 'none';
            
            titulosSection.style.display = isHidden ? 'block' : 'none';
            this.textContent = isHidden ? '− Ocultar títulos alternativos' : '+ Mostrar títulos alternativos';
            
            // Si se está mostrando la sección, inicializar los selects si es necesario
            if (isHidden) {
                initializeExistingTitulosAlternativos(titulosSection);
            }
        });
    });
    
    // Agregar título alternativo
    container.querySelectorAll('.btn-add-titulo-alternativo').forEach(btn => {
        btn.addEventListener('click', function() {
            addTituloAlternativo(this);
        });
    });
    
    // Inicializar títulos alternativos existentes
    initializeExistingTitulosAlternativos(container);
}

// Función para inicializar títulos alternativos existentes
async function initializeExistingTitulosAlternativos(container) {
    const titulosAlternativos = container.querySelectorAll('.titulo-alternativo');
    
    if (titulosAlternativos.length === 0) return;
    
    try {
        // Cargar idiomas y países en paralelo
        await Promise.all([
            cargarIdiomas(),
            cargarPaises()
        ]);
        
        // Inicializar cada título alternativo
        titulosAlternativos.forEach(tituloAlt => {
            // Inicializar Select2 para los selects existentes
            $(tituloAlt).find('.select2').select2({
                width: '100%',
                allowClear: true
            });
            
            // Configurar botón de eliminar si no está configurado
            const btnEliminar = tituloAlt.querySelector('.btn-remove');
            if (btnEliminar && !btnEliminar.hasAttribute('data-initialized')) {
                btnEliminar.setAttribute('data-initialized', 'true');
                const episodioNum = btnEliminar.closest('.titulos-alternativos')
                    .previousElementSibling
                    .querySelector('.toggle-titulos')
                    .getAttribute('data-episodio');
                
                btnEliminar.addEventListener('click', function() {
                    tituloAlt.remove();
                    actualizarContadorTitulos(episodioNum);
                });
            }
        });
    } catch (error) {
        console.error('Error al inicializar títulos alternativos existentes:', error);
    }
}

// Función para actualizar el contador de títulos alternativos
function actualizarContadorTitulos(episodioNum) {
    const header = document.querySelector(`.episodio-header[data-episodio="${episodioNum}"]`);
    if (!header) return;
    
    const contador = header.querySelector('.episodio-contador-titulos');
    const count = header.closest('tr').querySelectorAll('.titulo-alternativo').length;
    contador.textContent = count === 0 ? '0 títulos traducidos' : `${count} título${count !== 1 ? 's' : ''} traducido${count !== 1 ? 's' : ''}`;
}

// Función para agregar un título alternativo
async function addTituloAlternativo(button) {
    const episodioNum = button.getAttribute('data-episodio');
    const container = button.closest('.titulos-alternativos');
    const listaTitulos = container.querySelector('.titulos-alternativos-lista');
    const template = document.getElementById('tituloAlternativoTemplate');
    
    if (!template || !listaTitulos) return;
    
    const clone = template.content.cloneNode(true);
    const tituloAlt = clone.querySelector('.titulo-alternativo');
    
    // Agregar el título alternativo a la lista
    listaTitulos.appendChild(tituloAlt);
    
    // Obtener referencias a los selects
    const idiomaSelect = tituloAlt.querySelector('.idioma-alternativo');
    const paisSelect = tituloAlt.querySelector('.pais-alternativo');
    
    // Configurar botón de eliminar
    const btnEliminar = tituloAlt.querySelector('.btn-remove');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', function() {
            tituloAlt.remove();
            actualizarContadorTitulos(episodioNum);
        });
    }
    
    try {
        // Cargar idiomas y países en paralelo
        await Promise.all([
            cargarIdiomas(),
            cargarPaises()
        ]);
        
        // Actualizar los selects con los datos cargados
        if (idiomaSelect) {
            actualizarSelectsIdiomas(idiomaSelect);
        }
        
        if (paisSelect) {
            actualizarSelectsPaises(paisSelect);
        }
        
        // Inicializar Select2 para los nuevos selects
        $(tituloAlt).find('.select2').select2({
            width: '100%',
            allowClear: true
        });
        
    } catch (error) {
        console.error('Error al cargar datos para el título alternativo:', error);
    }
    
    // Actualizar el contador
    actualizarContadorTitulos(episodioNum);
}

// Función para eliminar un título alternativo
function removeTituloAlternativo(button) {
    if (confirm('¿Está seguro de eliminar este título alternativo?')) {
        const tituloAlt = button.closest('.titulo-alternativo');
        if (tituloAlt) {
            tituloAlt.remove();
        }
    }
}

// Función para actualizar los selects de países en el formulario
function actualizarSelectsPaises(container = null) {
    if (!listaPaisesGlobal || listaPaisesGlobal.length === 0) return;
    
    // Ordenar países alfabéticamente (ignorando mayúsculas y tildes)
    const collator = new Intl.Collator('es', {sensitivity: 'base'});
    const paisesOrdenados = [...listaPaisesGlobal].sort(collator.compare);
    
    // Obtener los selects objetivo
    let selects = [];
    
    if (container) {
        // Si se proporciona un contenedor, buscar solo los selects dentro de él
        selects = Array.from(container.querySelectorAll('select.pais-alternativo'));
    } else {
        // Si no hay contenedor, obtener todos los selects de países excepto el de producción
        // (que ya se maneja en cargarPaises)
        selects = Array.from(document.querySelectorAll('select.pais-alternativo'));
    }
    
    selects.forEach(select => {
        if (!select) return;
        
        // Verificar si es un select2
        const esSelect2 = select.classList.contains('select2');
        const isMultiple = select.hasAttribute('multiple');
        const valorActual = isMultiple ? 
            Array.from(select.selectedOptions).map(opt => opt.value) : 
            select.value;
        
        // Limpiar opciones existentes
        select.innerHTML = '';
        
        // Agregar opción por defecto solo si no es múltiple
        if (!isMultiple) {
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Seleccione un país...';
            select.appendChild(defaultOption);
        }
        
        // Agregar países ordenados
        paisesOrdenados.forEach(pais => {
            const option = document.createElement('option');
            option.value = pais;
            option.textContent = pais;
            select.appendChild(option);
        });
        
        // Restaurar el/los valor(es) seleccionado(s) si existe(n)
        if (isMultiple && Array.isArray(valorActual) && valorActual.length > 0) {
            $(select).val(valorActual).trigger('change');
        } else if (valorActual) {
            select.value = valorActual;
        }
        
        // Si es un select2, inicializarlo o actualizarlo
        if (esSelect2) {
            if (!select.classList.contains('select2-hidden-accessible')) {
                $(select).select2({
                    width: '100%',
                    allowClear: true,
                    placeholder: isMultiple ? 'Seleccione países...' : 'Seleccione un país...',
                    multiple: isMultiple,
                    language: {
                        noResults: function() {
                            return 'No se encontraron resultados';
                        }
                    }
                });
            } else {
                // Si ya es un select2, actualizarlo
                $(select).trigger('change.select2');
            }
        }
    });
}

// Función para manejar el evento de generar tabla
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('btn-generar-tabla')) {
        const button = e.target;
        const bloqueEpisodios = button.closest('.bloque-episodios');
        const desdeEpisodio = bloqueEpisodios.querySelector('.desdeEpisodio');
        const hastaEpisodio = bloqueEpisodios.querySelector('.hastaEpisodio');
        
        // Escuchar cambios en los inputs de rango de episodios
        if (desdeEpisodio && hastaEpisodio) {
            // Validar que el valor de 'hasta' no sea menor que 'desde'
            desdeEpisodio.addEventListener('change', function() {
                if (parseInt(hastaEpisodio.value) < parseInt(this.value)) {
                    hastaEpisodio.value = this.value;
                }
            });
            
            hastaEpisodio.addEventListener('change', function() {
                if (parseInt(this.value) < parseInt(desdeEpisodio.value)) {
                    this.value = desdeEpisodio.value;
                }
            });
        }
        
        if (!desdeEpisodio || !hastaEpisodio) return;
        
        const desde = parseInt(desdeEpisodio.value) || 1;
        let hasta = parseInt(hastaEpisodio.value) || 1;
        
        // Asegurarse de que 'hasta' sea mayor o igual a 'desde'
        if (hasta < desde) {
            hasta = desde;
            hastaEpisodio.value = hasta;
        }
        
        // Limitar a un máximo de 50 episodios por bloque para evitar problemas de rendimiento
        if ((hasta - desde + 1) > 50) {
            alert('Por favor, limita el rango a un máximo de 50 episodios por bloque.');
            return;
        }
        
        generateEpisodiosIndividuales(bloqueEpisodios, desde, hasta);
    }
});

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

// URLs de las APIs
const POWER_AUTOMATE_URL = 'https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/b4efa70c80654ec488236ec10a4fb4b4/triggers/manual/paths/invoke';
const EXHIBICION_INTERNACIONAL_URL = 'https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/a2618e60a1c84211bbf231439de40d30/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentName=Default-0c130962-09bc-40fc-8db8-9d043ff6251a&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=dMhu-Au_gR4ozbNEFHHs5gUChZjfs-GEmby9R-RIF8c';
const TITULOS_ALTERNATIVOS_URL = 'https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1b930873b18a42acab095d29f2d032f3/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentName=Default-0c130962-09bc-40fc-8db8-9d043ff6251a&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jEJn56kt5hndekcqoMEgakGiAGjyqHYB6dJPMvOqV5U';
const NOTIFICACION_EMAIL_URL = 'https://default0c13096209bc40fc8db89d043ff625.1a.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/eff02a9286144933aaf4ad5b3122d933/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentName=Default-0c130962-09bc-40fc-8db8-9d043ff6251a&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=qpcA0v-sELsWdPR9RYAGE-q62Oj9llGFdiR2p5G44QA';

const POWER_AUTOMATE_PARAMS = {
    'api-version': '1',
    'tenantId': 'tId',
    'environmentName': 'Default-0c130962-09bc-40fc-8db8-9d043ff6251a',
    'sp': '/triggers/manual/run',
    'sv': '1.0',
    'sig': 'F1kVR1aS2F84dre8fnUgdPwgBO1UK4uxCl4BIASpkRg'
};

// Función para recopilar y enviar datos de exhibición internacional
async function enviarExhibicionesInternacionales() {
    try {
        console.log('Iniciando recopilación de datos de exhibición internacional...');
        const exhibiciones = [];
        const exhibicionItems = document.querySelectorAll('.exhibicion-item');
        const formId = document.getElementById('obraForm')?.id || 'formulario-sin-id';
        let exhibicionesValidas = 0;
        
        // Recopilar datos de cada exhibición
        exhibicionItems.forEach((item, index) => {
            try {
                // Obtener referencias a los elementos del formulario
                const tituloInput = item.querySelector('.otroTitulo');
                const idiomaSelect = item.querySelector('.idiomaExhibicion');
                const paisSelect = item.querySelector('.paisExhibicion');
                const canalSelect = item.querySelector('.canalExhibicion');
                
                // Verificar que todos los elementos existan
                if (!tituloInput || !idiomaSelect || !paisSelect || !canalSelect) {
                    console.warn(`Exhibición ${index + 1} ignorada: Faltan elementos del formulario`);
                    return; // Pasar a la siguiente iteración
                }
                
                // Función para obtener el valor de un campo Select2 o input normal
                const getCleanValue = (element) => {
                    // Si es un Select2
                    if ($(element).hasClass('select2-hidden-accessible')) {
                        try {
                            const select2Data = $(element).select2('data');
                            const value = select2Data && select2Data[0] ? select2Data[0].text : '';
                            // Si es el valor por defecto de Select2, devolver vacío
                            return (value === 'Buscar o agregar...' || value === 'Seleccione...') ? '' : value.trim();
                        } catch (e) {
                            console.warn('Error al obtener valor de Select2:', e);
                            return element.value?.trim() || '';
                        }
                    }
                    // Si es un input normal
                    return element.value?.trim() || '';
                };

                // Obtener valores usando la función helper
                const titulo = tituloInput.value?.trim() || '';
                const idioma = getCleanValue(idiomaSelect);
                const pais = getCleanValue(paisSelect);
                const canal = getCleanValue(canalSelect);
                
                console.log(`Exhibición ${index + 1}:`, { titulo, idioma, pais, canal });
                
                // Verificar campos obligatorios (solo título para este caso)
                const camposObligatorios = [titulo];
                const camposObligatoriosLlenos = camposObligatorios.every(campo => 
                    typeof campo === 'string' && campo.trim().length > 0
                );
                
                // Solo agregar si los campos obligatorios están completos
                if (camposObligatoriosLlenos) {
                    exhibiciones.push({
                        titulo,
                        idioma: idioma || '',
                        pais: pais || '',
                        canal: canal || '',
                        apartado_form: 'exhibicion_internacional'
                    });
                    exhibicionesValidas++;
                    console.log(`Exhibición ${index + 1} agregada correctamente`);
                } else {
                    console.warn(`Exhibición ${index + 1} ignorada: Faltan campos obligatorios`, 
                        { titulo, idioma, pais, canal });
                }
            } catch (error) {
                console.error(`Error al procesar la exhibición ${index + 1}:`, error);
            }
        });
        
        if (exhibiciones.length === 0) {
            console.log('No hay datos de exhibición internacional completos para enviar');
            return { 
                success: true, 
                message: 'No hay datos de exhibición para enviar', 
                count: 0,
                exhibicionesValidas: 0,
                totalExaminadas: exhibicionItems.length
            };
        }
        
        console.log(`Enviando ${exhibiciones.length} de ${exhibicionItems.length} exhibiciones internacionales...`);
        
        // Validar que haya al menos una exhibición válida
        if (exhibiciones.length === 0) {
            console.log('No hay exhibiciones válidas para enviar');
            return { 
                success: true, 
                message: 'No hay exhibiciones válidas para enviar', 
                count: 0,
                exhibicionesValidas: 0,
                totalExaminadas: exhibicionItems.length
            };
        }
        
        // Obtener el título original de la obra
        const tituloObra = document.getElementById('tituloOriginal')?.value || 'Sin título';
        console.log('Título de la obra obtenido:', tituloObra); // Para depuración
        
        // Crear un array con todas las exhibiciones válidas
        const requestData = exhibiciones.map(exhibicion => ({
            titulo: exhibicion.titulo || '',
            titulo_original: tituloObra,  // Agregar el título original de la obra
            idioma: exhibicion.idioma || '',
            pais: exhibicion.pais || '',
            canal: exhibicion.canal || '',
            apartado_form: exhibicion.apartado_form || 'exhibicion_internacional'
        }));
        
        console.log('Enviando exhibiciones:', requestData);
        
        // Mostrar información de depuración detallada
        console.log('=== INFORMACIÓN DE DEPURACIÓN ===');
        console.log('URL de envío:', EXHIBICION_INTERNACIONAL_URL);
        console.log('Headers:', {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        });
        console.log('Datos a enviar (JSON):', JSON.stringify(requestData, null, 2));
        console.log('Datos a enviar (raw):', requestData);
        console.log('=== FIN DE INFORMACIÓN DE DEPURACIÓN ===');
        
        try {
            // Enviar datos al servidor
            const response = await fetch(EXHIBICION_INTERNACIONAL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                // Enviar el array de exhibiciones
                body: JSON.stringify(requestData)
            });
            
            console.log('Respuesta del servidor (cruda):', response);
            
            // Procesar la respuesta del servidor
            let responseData = {};
            const responseText = await response.text();
            
            console.log('=== RESPUESTA DEL SERVIDOR ===');
            console.log('Status:', response.status, response.statusText);
            console.log('Headers:', Object.fromEntries(response.headers.entries()));
            
            // Intentar parsear la respuesta como JSON si no está vacía
            if (responseText && responseText.trim() !== '') {
                try {
                    responseData = JSON.parse(responseText);
                } catch (e) {
                    console.warn('No se pudo parsear la respuesta como JSON:', e);
                }
            }
            
            console.log('Datos de respuesta:', responseData);
            console.log('Texto de respuesta:', responseText || '(Vacío)');
            console.log('=== FIN DE RESPUESTA ===');
            
            if (!response.ok) {
                throw new Error(`Error en el servidor: ${response.status} - ${response.statusText}`);
            }
            
            console.log('Datos de exhibición internacional enviados correctamente. Total de exhibiciones:', exhibicionesValidas);
            return { 
                success: true, 
                message: 'Datos guardados correctamente', 
                count: exhibicionesValidas,
                responseData: responseData || {}
            };
            
        } catch (error) {
            console.error('Error en la petición fetch:', error);
            return {
                success: false,
                message: error.message || 'Error al enviar datos de exhibición internacional',
                error: error.toString(),
                exhibicionesValidas: 0,
                totalExaminadas: exhibicionItems.length
            };
        }
        
    } catch (error) {
        console.error('Error en enviarExhibicionesInternacionales:', error);
        return {
            success: false,
            message: error.message || 'Error al enviar datos de exhibición internacional',
            error: error.toString(),
            exhibicionesValidas: 0,
            totalExaminadas: exhibicionItems.length
        };
    }
}

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
function actualizarSelectsIdiomas(container = null) {
    // Si no se proporciona un contenedor, actualizar todos los selects de idioma
    const containers = container ? [container] : [
        document.getElementById('idioma'),
        ...document.querySelectorAll('.idiomaExhibicion, .idioma-alternativo')
    ].filter(el => el);

    containers.forEach(select => {
        // Solo actualizar si no es un Select2 ya inicializado o si es un contenedor específico
        if (select && !select.classList.contains('select2-hidden-accessible')) {
            // Guardar el valor seleccionado actual
            const valorActual = select.value;
            const esSelect2 = select.matches('.select2');
            
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
            
            // Si es un select2, inicializarlo
            if (esSelect2 && !select.classList.contains('select2-hidden-accessible')) {
                $(select).select2({
                    width: '100%',
                    allowClear: true
                });
            }
        }
    });
}

// Función para cargar la lista de roles
let listaRolesGlobal = [];

async function cargarRoles() {
    try {
        // Agregar timestamp para evitar caché
        const timestamp = new Date().getTime();
        const response = await fetch(`assets/rol.json?v=${timestamp}`);
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

// Función para actualizar la visibilidad de las secciones según el formato seleccionado
function actualizarVisibilidadSecciones() {
    const tipoFormato = document.getElementById('tipoFormato');
    const episodiosSection = document.getElementById('episodiosSection');
    const lineasNoSerializadasSection = document.getElementById('lineasNoSerializadasSection');
    
    if (!tipoFormato || !episodiosSection || !lineasNoSerializadasSection) return;
    
    const formatoSeleccionado = tipoFormato.value;
    const esSerieOTelenovela = formatoSeleccionado === 'Serie' || formatoSeleccionado === 'Telenovela';
    
    // Mostrar/ocultar secciones según el formato
    episodiosSection.style.display = esSerieOTelenovela ? 'block' : 'none';
    lineasNoSerializadasSection.style.display = esSerieOTelenovela ? 'none' : 'block';
    
    // Si no hay formato seleccionado, ocultar ambas secciones
    if (!formatoSeleccionado) {
        episodiosSection.style.display = 'none';
        lineasNoSerializadasSection.style.display = 'none';
    }
}

// Mapeo de formatos a géneros disponibles
const formatosGeneros = {
    'Largometraje': ['Ficción', 'Documental'],
    'Cortometraje': ['Ficción', 'Documental'],
    'Serie': ['Ficción'],
    'Telenovela': ['Ficción'],
    'Serie documental': ['Noticias', 'Reportaje', 'Documental']
};

// Función para actualizar las opciones del select de género y la visibilidad de las secciones
function actualizarGeneros(formatoSeleccionado) {
    const generoSelect = document.getElementById('genero');
    if (!generoSelect) return;
    
    // Limpiar opciones actuales
    generoSelect.innerHTML = '';
    
    if (!formatoSeleccionado) {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccione un formato primero';
        generoSelect.disabled = true;
        generoSelect.appendChild(defaultOption);
        
        // Actualizar visibilidad de secciones
        actualizarVisibilidadSecciones();
        return;
    }
    
    // Agregar opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Seleccione un género...';
    generoSelect.appendChild(defaultOption);
    
    // Agregar opciones según el formato seleccionado
    const generos = formatosGeneros[formatoSeleccionado] || [];
    generos.forEach(genero => {
        const option = document.createElement('option');
        option.value = genero;
        option.textContent = genero;
        generoSelect.appendChild(option);
    });
    
    // Habilitar el select
    generoSelect.disabled = false;
    
    // Actualizar visibilidad de secciones
    actualizarVisibilidadSecciones();
}

// Asignar el manejador de envío del formulario
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarRoles();
    cargarIdiomas();
    cargarProductoras();
    cargarPaises();
    
    // Inicializar el select de género
    actualizarGeneros();
    
    // Event listener para cambios en el select de formato
    const tipoFormato = document.getElementById('tipoFormato');
    if (tipoFormato) {
        tipoFormato.addEventListener('change', function() {
            actualizarGeneros(this.value);
        });
    }
    
    // Configurar validación de campos de nombres
    setupNameValidation();
    
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
    
    // Inicializar eventos para los botones de exhibiciones
    const addExhibicionBtn = document.getElementById('addExhibicion');
    if (addExhibicionBtn) {
        addExhibicionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addExhibicion();
        });
    }
    
    // Inicializar eventos para los botones de bloques de episodios
    const addBloqueBtn = document.getElementById('addBloqueEpisodios');
    if (addBloqueBtn) {
        addBloqueBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addBloqueEpisodios();
        });
    }
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
async function cargarPaises() {
    // Mostrar indicador de carga
    const selectPais = document.getElementById('paisProduccion');
    
    // Verificar si el select existe
    if (!selectPais) {
        console.error('No se encontró el elemento select de país de producción');
        return [];
    }
    
    const isSelect2Initialized = $(selectPais).hasClass('select2-hidden-accessible');
    
    // Mostrar indicador de carga
    const loadingOption = new Option('Cargando países...', '', true, true);
    loadingOption.disabled = true;
    selectPais.innerHTML = '';
    selectPais.add(loadingOption);

    try {
        // Hacer la petición para obtener los países
        const response = await fetch('assets/paises.json');
        if (!response.ok) {
            throw new Error('No se pudo cargar la lista de países');
        }
        
        const paises = await response.json();
        
        // Guardar la lista de países globalmente
        listaPaisesGlobal = paises.map(pais => pais.País);
        
        // Ordenar países alfabéticamente (ignorando mayúsculas y tildes)
        const collator = new Intl.Collator('es', {sensitivity: 'base'});
        const paisesOrdenados = [...listaPaisesGlobal].sort(collator.compare);
        
        // Guardar el valor actual si existe
        const currentValues = $(selectPais).val() || [];
        
        // Limpiar opciones existentes
        selectPais.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = new Option('Seleccione países...', '', false, false);
        selectPais.add(defaultOption);
        
        // Agregar países ordenados
        paisesOrdenados.forEach(pais => {
            const option = new Option(pais, pais, false, false);
            selectPais.add(option);
        });
        
        // Si Select2 ya estaba inicializado, destruirlo primero
        if (isSelect2Initialized) {
            $(selectPais).select2('destroy');
        }
        
        // Inicializar Select2 con configuración
        $(selectPais).select2({
            placeholder: 'Seleccione o agregue países...',
            allowClear: true,
            multiple: true,
            width: '100%',
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
            language: {
                noResults: function() {
                    return 'No se encontraron resultados';
                }
            }
        });
        
        // Restaurar valores seleccionados si existen
        if (currentValues.length > 0) {
            $(selectPais).val(currentValues).trigger('change');
        }
        
        // Actualizar otros selects de países en el formulario
        actualizarSelectsPaises();
        
        return paisesOrdenados;
    } catch (error) {
        console.error('Error al cargar los países:', error);
        
        // Valores por defecto en caso de error
        listaPaisesGlobal = [
            'Chile', 'Argentina', 'México', 'España', 'Colombia', 
            'Perú', 'Venezuela', 'Ecuador', 'Guatemala', 'Cuba',
            'Bolivia', 'República Dominicana', 'Honduras', 'Paraguay', 'El Salvador',
            'Nicaragua', 'Costa Rica', 'Panamá', 'Uruguay', 'Puerto Rico'
        ];
        
        // Actualizar el select de país de producción con valores por defecto
        if (selectPais) {
            selectPais.innerHTML = '';
            
            // Agregar opción por defecto
            const defaultOption = new Option('Seleccione países...', '', false, false);
            selectPais.add(defaultOption);
            
            // Agregar países por defecto
            listaPaisesGlobal.forEach(pais => {
                const option = new Option(pais, pais, false, false);
                selectPais.add(option);
            });
            
            // Inicializar Select2 si no está inicializado
            if (!isSelect2Initialized) {
                $(selectPais).select2({
                    placeholder: 'Seleccione o agregue países...',
                    allowClear: true,
                    multiple: true,
                    width: '100%',
                    tags: true,
                    language: {
                        noResults: function() {
                            return 'No se encontraron resultados';
                        }
                    }
                });
            }
        }
        
        // Actualizar otros selects de países en el formulario
        actualizarSelectsPaises();
        
        // Mostrar mensaje de error
        showMessage('Error al cargar la lista de países. Se han cargado países por defecto.', true);
        
        return listaPaisesGlobal;
    }
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

// Función para recolectar los títulos alternativos de los episodios
function recolectarTitulosAlternativos() {
    console.log('=== INICIO recopilación de títulos alternativos ===');
    const titulosAlternativos = [];
    const tituloOriginal = document.getElementById('tituloOriginal')?.value || '';
    console.log('Título original:', tituloOriginal);
    
    // Obtener todas las tablas de episodios
    const tablasEpisodios = document.querySelectorAll('.tabla-episodios');
    console.log('Tablas de episodios encontradas:', tablasEpisodios.length);
    
    tablasEpisodios.forEach((tabla, i) => {
        console.log(`Procesando tabla ${i+1}/${tablasEpisodios.length}`);
        
        // Obtener todas las filas de la tabla (excepto el encabezado)
        const filas = tabla.querySelectorAll('tbody tr.episodio-fila');
        console.log(`  Filas de episodios en la tabla: ${filas.length}`);
        
        filas.forEach((fila, j) => {
            console.log(`  Procesando fila ${j+1}/${filas.length}`);
            
            // Obtener el número y título del episodio
            const nroEpisodio = fila.querySelector('.episodio-numero')?.textContent?.trim() || '';
            const tituloEpisodio = fila.querySelector('.titulo-episodio')?.value?.trim() || '';
            console.log(`    Nro episodio: ${nroEpisodio}, Título: ${tituloEpisodio}`);
            
            // Obtener los títulos alternativos del episodio
            const titulosAltContainer = fila.querySelector('.titulos-alternativos-lista');
            if (!titulosAltContainer) {
                console.log('    No se encontró el contenedor de títulos alternativos');
                return;
            }
            
            const titulosAlt = titulosAltContainer.querySelectorAll('.titulo-alternativo');
            console.log(`    Títulos alternativos encontrados: ${titulosAlt.length}`);
            
            titulosAlt.forEach((tituloAlt, k) => {
                console.log(`    Procesando título alternativo ${k+1}/${titulosAlt.length}`);
                const tituloAlternativo = tituloAlt.querySelector('.otro-titulo')?.value?.trim() || '';
                const idioma = tituloAlt.querySelector('.idioma-alternativo')?.value?.trim() || '';
                const pais = tituloAlt.querySelector('.pais-alternativo')?.value?.trim() || '';
                
                console.log(`      Título: "${tituloAlternativo}", Idioma: "${idioma}", País: "${pais}"`);
                
                // Solo requerimos que exista el título alternativo
                if (tituloAlternativo) {
                    const tituloCompleto = {
                        titulo_original: tituloOriginal,
                        nro_episodio: nroEpisodio.replace('Episodio ', ''), // Quitar el texto 'Episodio '
                        titulo_episodio: tituloEpisodio,
                        titulo_alternativo: tituloAlternativo,
                        idioma: idioma || '', // Cadena vacía si no se especifica
                        pais: pais || '', // Cadena vacía si no se especifica
                        apartado_form: 'otros_titulos_episodios'
                    };
                    console.log('      Añadiendo título alternativo:', tituloCompleto);
                    titulosAlternativos.push(tituloCompleto);
                } else {
                    console.log('      Título alternativo vacío, no se incluirá');
                }
            });
        });
    });
    
    console.log('=== FIN recopilación de títulos alternativos ===');
    console.log('Total de títulos alternativos encontrados:', titulosAlternativos.length);
    return titulosAlternativos;
}

// Función para enviar los títulos alternativos al servidor
async function enviarTitulosAlternativos() {
    const titulos = recolectarTitulosAlternativos();
    
    // Si no hay títulos alternativos, no es necesario enviar nada
    if (titulos.length === 0) {
        console.log('No hay títulos alternativos para enviar');
        return { success: true };
    }
    
    try {
        const response = await fetch(TITULOS_ALTERNATIVOS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(titulos)
        });
        
        if (!response.ok) {
            throw new Error(`Error al enviar títulos alternativos: ${response.status}`);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error al enviar títulos alternativos:', error);
        return { 
            success: false, 
            error: 'Error al enviar los títulos alternativos. Por favor, intente nuevamente.' 
        };
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

// Función para verificar el reCAPTCHA
async function verificarRecaptcha() {
    // Esperar a que grecaptcha esté disponible
    if (typeof grecaptcha === 'undefined') {
        console.error('reCAPTCHA no está cargado correctamente');
        return false;
    }

    const response = grecaptcha.getResponse();
    if (!response) {
        // Mostrar mensaje de error
        const errorElement = document.getElementById('recaptcha-error');
        if (errorElement) {
            errorElement.style.display = 'block';
        }
        return false;
    }
    
    // Validar el token con la función de Azure
    try {
        const verificationResponse = await fetch('https://captchaformav.azurewebsites.net/api/verifyRecaptcha', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: response })
        });
        
        const data = await verificationResponse.json();
        return data.success;
    } catch (error) {
        console.error('Error al verificar el reCAPTCHA:', error);
        return false;
    }
}

// Función para manejar el envío del formulario
async function submitFormData(event) {
    event.preventDefault();

    // Ocultar mensajes de error previos
    const errorElement = document.getElementById('recaptcha-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }

    // Validar reCAPTCHA
    try {
        const esRecaptchaValido = await verificarRecaptcha();
        if (!esRecaptchaValido) {
            // Mostrar mensaje de error específico
            const errorMessage = document.getElementById('recaptcha-error');
            if (errorMessage) {
                errorMessage.textContent = 'Por favor, completa la verificación de reCAPTCHA.';
                errorMessage.style.display = 'block';
            } else {
                mostrarErrorValidacion('Por favor, verifica que no eres un robot.');
            }
            // Recargar el reCAPTCHA
            if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
                grecaptcha.reset();
            }
            return;
        }
    } catch (error) {
        console.error('Error validando reCAPTCHA:', error);
        mostrarErrorValidacion('Error al validar el reCAPTCHA. Por favor, recarga la página e inténtalo de nuevo.');
        return;
    }

    // Formatear campos de nombres (actores, directores, guionistas)
    validarCamposNombres();

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
        
        // Iniciar el envío de exhibiciones internacionales en paralelo
        const envioExhibiciones = enviarExhibicionesInternacionales();
        
        // Recopilar datos del formulario principal
        const formData = collectFormData();
        
        if (formData.length === 0) {
            throw new Error('No hay datos para enviar. Por favor, complete al menos un episodio.');
        }
        
        console.log('Datos del formulario principal a enviar:', formData);
        
        // Construir URL con parámetros
        const url = new URL(POWER_AUTOMATE_URL);
        Object.entries(POWER_AUTOMATE_PARAMS).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        
        console.log('URL de la solicitud principal:', url.toString());
        
        // Enviar datos principales al servidor
        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(formData),
            mode: 'cors'
        });
        
        // Procesar respuesta del envío principal
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error en la respuesta del servidor (principal):', response.status, errorText);
            throw new Error(`Error en el servidor: ${response.status} - ${errorText}`);
        }
        
        // Esperar a que termine el envío de exhibiciones (o falle)
        let resultadoExhibiciones;
        let titulosResult = { success: true };
        
        try {
            // Esperar a que termine el envío de exhibiciones
            resultadoExhibiciones = await envioExhibiciones;
            
            // Si es una serie, enviar títulos alternativos
            const tipoFormato = document.getElementById('tipoFormato')?.value;
            if (tipoFormato === 'Serie') {
                console.log('Enviando títulos alternativos...');
                titulosResult = await enviarTitulosAlternativos();
                console.log('Resultado del envío de títulos alternativos:', titulosResult);
            }
            
            // Manejar resultados de exhibiciones
            if (resultadoExhibiciones && !resultadoExhibiciones.success) {
                console.warn('Advertencia en el envío de exhibiciones:', resultadoExhibiciones.message);
                showMessage(
                    `Se completó el envío, pero hubo un problema con las exhibiciones: ${resultadoExhibiciones.message}`,
                    'warning'
                );
            } 
            // Manejar resultados de títulos alternativos
            else if (!titulosResult.success) {
                console.warn('Advertencia en el envío de títulos alternativos:', titulosResult.error);
                showMessage(
                    `Se completó el envío, pero hubo un problema con los títulos alternativos: ${titulosResult.error}`,
                    'warning'
                );
            }
            // Mostrar mensaje de éxito general
            else if (resultadoExhibiciones?.count > 0) {
                console.log(`Se enviaron ${resultadoExhibiciones.count} exhibiciones internacionales correctamente`);
                showMessage(
                    `¡Formulario enviado correctamente! ` +
                    `Se registraron ${resultadoExhibiciones.count} exhibiciones internacionales.`,
                    false
                );
            } else {
                // Solo mostrar éxito del formulario principal si no hay exhibiciones
                showMessage('¡La declaración se ha enviado correctamente!', false);
                
                // Enviar notificación por correo
                try {
                    const formDataArray = collectFormData();
                    const formData = formDataArray.length > 0 ? formDataArray[0] : {};
                    
                    // Depuración: Mostrar todo el objeto formData
                    console.log('Datos completos del formulario:', formDataArray);
                    console.log('Primer objeto del formulario:', formData);
                    
                    // Depuración: Ver valores específicos
                    console.log('Valor de titulo_original:', formData.titulo_original);
                    console.log('Valor de tipo_formato:', formData.tipo_formato);
                    
                    const emailData = {
                        titulo_original: formData.titulo_original || 'Sin título',
                        tipo_formato: formData.tipo_formato || 'No especificado',
                        fecha_declaracion: new Date().toISOString().split('T')[0],
                        enlace_tablas: 'https://tudominio.com/declaraciones/' + Date.now(),
                        correo_destinatario: 'tudestinatario@ejemplo.com'
                    };
                    
                    console.log('Datos a enviar por correo:', emailData); // Para depuración
                    
                    await fetch(NOTIFICACION_EMAIL_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(emailData)
                    });
                    
                    console.log('Notificación por correo enviada correctamente');
                } catch (emailError) {
                    console.error('Error al enviar notificación por correo:', emailError);
                    // No mostramos error al usuario para no interrumpir el flujo exitoso
                }
                
                // Limpiar el formulario después de un envío exitoso
                limpiarFormulario();
            }
        } catch (error) {
            console.error('Error al procesar el envío:', error);
            // Mostrar advertencia pero no fallar el envío completo
            showMessage(
                '¡Formulario enviado correctamente! ' +
                'Sin embargo, hubo un problema al guardar información adicional.', 
                'warning'
            );
        }
        
        // Limpiar el formulario después de 2 segundos
        setTimeout(() => {
            limpiarFormulario();
        }, 2000);
        
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

// Función para formatear nombres separados por comas
function formatNames(input) {
    if (!input || !input.value) return true;
    
    // Eliminar espacios múltiples y espacios alrededor de comas
    let value = input.value
        .replace(/\s*,\s*/g, ', ')  // Reemplazar comas con o sin espacios por coma + espacio
        .replace(/\s+/g, ' ')        // Reemplazar múltiples espacios por uno solo
        .replace(/,\s*$/, '');      // Eliminar coma al final si existe
    
    // Actualizar el valor del input
    input.value = value;
    return true;
}

// Función para configurar la validación de campos de nombres
function setupNameValidation() {
    const nameFields = ['actores', 'directores', 'guionistas'];
    
    nameFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            // Validar al perder el foco
            input.addEventListener('blur', function() {
                formatNames(this);
            });
            
            // Validar al presionar Enter
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    formatNames(this);
                }
            });
        }
    });
}

// Función para formatear los campos de nombres antes del envío
function validarCamposNombres() {
    const nameFields = ['actores', 'directores', 'guionistas'];
    
    nameFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            formatNames(input);
        }
    });
    
    return true;
}

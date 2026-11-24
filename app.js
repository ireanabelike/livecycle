const profileForm = document.querySelector("#profile-form");
const profileModal = document.querySelector("#profile-modal");
const authScreen = document.querySelector("#auth-screen");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const loginMessage = document.querySelector("#login-message");
const registerMessage = document.querySelector("#register-message");
const evaluationForm = document.querySelector("#evaluation-form");
const historyRows = document.querySelector("#audit-rows");
const catalogGrid = document.querySelector("#catalog-grid");
const catalogSearch = document.querySelector("#catalog-search");
const catalogCategory = document.querySelector("#catalog-category");
const componentSearch = document.querySelector("#component-search");
const componentSelect = document.querySelector("#component");
const areaSelect = document.querySelector("#area-select");
const areaForm = document.querySelector("#area-form");
const areaNameField = document.querySelector("#area-name");
const areaList = document.querySelector("#area-list");
const areaMessage = document.querySelector("#area-message");
const machineSelect = document.querySelector("#machine-select");
const machineForm = document.querySelector("#machine-form");
const machineAreaSelect = document.querySelector("#machine-area-select");
const machineNameField = document.querySelector("#machine-name");
const machineMessage = document.querySelector("#machine-message");
const reportRows = document.querySelector("#report-rows");

let liveCycleCatalog = [];
let catalogCategoryNames = {};
let liveAreas = [];
let activeAccount = null;

const USERS_STORAGE_KEY = "livecycle-users";
const SESSION_STORAGE_KEY = "livecycle-session";
const AREAS_STORAGE_KEY = "livecycle-areas";
const AUDIT_STORAGE_PREFIX = "livecycle-audit-";
const PASSWORD_ITERATIONS = 210000;

function normalizeSearch(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function renderCatalog() {
  const search = normalizeSearch(catalogSearch.value.trim());
  const category = catalogCategory.value;
  const visibleParts = liveCycleCatalog.filter((part) => {
    const matchesCategory = !category || part.category === category;
    const searchableText = normalizeSearch(`${part.name} ${part.description} ${catalogCategoryNames[part.category]} ${part.life}`);
    return matchesCategory && searchableText.includes(search);
  });

  catalogGrid.replaceChildren();
  visibleParts.forEach((part) => {
    const article = document.createElement("article");
    article.className = "catalog-card";

    const number = document.createElement("div");
    number.className = "part-icon";
    number.textContent = String(liveCycleCatalog.indexOf(part) + 1).padStart(2, "0");

    const meta = document.createElement("div");
    meta.className = "part-meta";
    const family = document.createElement("span");
    family.textContent = catalogCategoryNames[part.category];
    const name = document.createElement("h3");
    name.textContent = part.name;
    const description = document.createElement("p");
    description.textContent = part.description;
    meta.append(family, name, description);

    const life = document.createElement("div");
    life.className = "part-life";
    const lifeValue = document.createElement("strong");
    lifeValue.textContent = part.life;
    const lifeLabel = document.createElement("span");
    lifeLabel.textContent = "VIDA ÚTIL APROX.";
    life.append(lifeValue, lifeLabel);

    article.append(number, meta, life);
    catalogGrid.append(article);
  });

  const count = document.querySelector("#catalog-count");
  count.textContent = visibleParts.length === liveCycleCatalog.length
    ? `${visibleParts.length} COMPONENTES`
    : `${visibleParts.length} DE ${liveCycleCatalog.length}`;

  let emptyMessage = catalogGrid.parentElement.querySelector(".catalog-empty");
  if (visibleParts.length === 0) {
    if (!emptyMessage) {
      emptyMessage = document.createElement("p");
      emptyMessage.className = "catalog-empty";
      emptyMessage.textContent = "No se encontraron repuestos. Prueba otro término o familia.";
      catalogGrid.after(emptyMessage);
    }
  } else if (emptyMessage) {
    emptyMessage.remove();
  }
}

function renderEvaluationComponents() {
  const selectedComponent = componentSelect.value;
  componentSelect.replaceChildren();
  const search = normalizeSearch(componentSearch.value.trim());
  const visibleParts = liveCycleCatalog.filter((part) =>
    normalizeSearch(`${part.name} ${part.id} ${part.description} ${catalogCategoryNames[part.category]}`).includes(search)
  );
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = !liveCycleCatalog.length
    ? "No hay piezas disponibles"
    : search && !visibleParts.length ? "No se encontraron piezas" : "Selecciona una pieza";
  componentSelect.append(placeholder);

  visibleParts.forEach((part) => {
    const option = document.createElement("option");
    option.value = part.id;
    option.textContent = `${part.name} · Ref. ${part.id}`;
    componentSelect.append(option);
  });
  componentSelect.disabled = liveCycleCatalog.length === 0;
  if (!visibleParts.some((part) => part.id === selectedComponent)) componentSelect.value = "";
  componentSearch.disabled = liveCycleCatalog.length === 0;
}

async function loadCatalog() {
  try {
    const response = await fetch("./data.json");
    if (!response.ok) {
      throw new Error(`No se pudo cargar data.json (HTTP ${response.status}).`);
    }

    const catalogData = await response.json();
    if (!Array.isArray(catalogData.categorias)) {
      throw new Error("El formato de data.json no contiene una lista de categorías.");
    }

    catalogCategoryNames = Object.fromEntries(
      catalogData.categorias.map((category) => [category.id, category.nombre])
    );
    liveCycleCatalog = catalogData.categorias.flatMap((category) => {
      if (!Array.isArray(category.repuestos)) {
        throw new Error(`La categoría "${category.nombre}" no contiene repuestos válidos.`);
      }
      return category.repuestos.map((part) => ({
        id: part.id,
        name: part.nombre,
        description: part.descripcion,
        life: part.vidaUtilAproximada,
        category: category.id
      }));
    });

    if (liveCycleCatalog.length === 0) {
      throw new Error("data.json no contiene repuestos para mostrar.");
    }
    renderEvaluationComponents();
    renderCatalog();
  } catch (error) {
    console.error("No se pudo cargar el catálogo de repuestos desde data.json.", error);
    liveCycleCatalog = [];
    renderEvaluationComponents();
    document.querySelector("#catalog-count").textContent = "ERROR DE CARGA";
    catalogGrid.replaceChildren();
    const message = document.createElement("p");
    message.className = "catalog-empty";
    message.textContent = "No se pudo cargar el catálogo. Verifica que data.json esté disponible junto a la página y vuelve a intentarlo.";
    catalogGrid.after(message);
  }
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function normalizeIdNumber(value) {
  return value.replace(/[^0-9]/g, "");
}

function isValidName(value) {
  return /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,98}[\p{L}\p{M}]$/u.test(value.trim());
}

function isValidIdNumber(value) {
  return /^[0-9]{6,12}$/.test(value);
}

function sanitizeIdNumberField(field) {
  const digitsOnly = normalizeIdNumber(field.value);
  if (field.value !== digitsOnly) field.value = digitsOnly;
  return setIdValidity(field);
}

function normalizeAreaName(value) {
  return normalizeSearch(value.trim().replace(/\s+/g, " "));
}

function readAreas() {
  const saved = localStorage.getItem(AREAS_STORAGE_KEY);
  if (!saved) return [];
  const areas = JSON.parse(saved);
  if (!Array.isArray(areas) || areas.some((area) =>
    !area || typeof area.id !== "string" || typeof area.name !== "string" ||
    !area.id.trim() || area.name.trim().length < 2 || area.name.trim().length > 80 ||
    (area.machines !== undefined && !Array.isArray(area.machines)) ||
    (Array.isArray(area.machines) && area.machines.some((machine) =>
      !machine || typeof machine.id !== "string" || typeof machine.name !== "string" ||
      !machine.id.trim() || machine.name.trim().length < 2 || machine.name.trim().length > 100
    ))
  )) {
    throw new Error("La lista guardada de áreas tiene un formato inválido.");
  }
  const normalizedAreas = areas.map((area) => ({
    id: area.id,
    name: area.name.trim().replace(/\s+/g, " "),
    machines: (area.machines || []).map((machine) => ({
      id: machine.id,
      name: machine.name.trim().replace(/\s+/g, " ")
    }))
  }));
  const ids = normalizedAreas.map((area) => area.id);
  const names = normalizedAreas.map((area) => normalizeAreaName(area.name));
  const machineIds = normalizedAreas.flatMap((area) => area.machines.map((machine) => machine.id));
  const duplicateMachineNames = normalizedAreas.some((area) => {
    const machineNames = area.machines.map((machine) => normalizeSearch(machine.name));
    return new Set(machineNames).size !== machineNames.length;
  });
  if (new Set(ids).size !== ids.length || new Set(names).size !== names.length ||
      new Set(machineIds).size !== machineIds.length || duplicateMachineNames) {
    throw new Error("La lista guardada de áreas contiene duplicados.");
  }
  return normalizedAreas;
}

function renderAreaSelect() {
  const selectedArea = areaSelect.value;
  areaSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = liveAreas.length ? "Selecciona un área" : "Registra un área en Gestión de áreas";
  areaSelect.append(placeholder);

  liveAreas.forEach((area) => {
    const option = document.createElement("option");
    option.value = area.id;
    option.textContent = area.name;
    areaSelect.append(option);
  });
  if (liveAreas.some((area) => area.id === selectedArea)) areaSelect.value = selectedArea;
  renderEvaluationMachines();
}

function renderEvaluationMachines() {
  const selectedMachine = machineSelect.value;
  const area = liveAreas.find((item) => item.id === areaSelect.value);
  machineSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = !area
    ? "Selecciona un área primero"
    : area.machines.length ? "Selecciona una máquina" : "Registra una máquina para esta área";
  machineSelect.append(placeholder);

  if (area) {
    area.machines.forEach((machine) => {
      const option = document.createElement("option");
      option.value = machine.id;
      option.textContent = machine.name;
      machineSelect.append(option);
    });
  }
  machineSelect.disabled = false;
  if (area && area.machines.some((machine) => machine.id === selectedMachine)) {
    machineSelect.value = selectedMachine;
  }
}

function renderMachineAreaSelect() {
  const selectedArea = machineAreaSelect.value;
  machineAreaSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = liveAreas.length ? "Selecciona un área" : "Registra un área primero";
  machineAreaSelect.append(placeholder);
  liveAreas.forEach((area) => {
    const option = document.createElement("option");
    option.value = area.id;
    option.textContent = area.name;
    machineAreaSelect.append(option);
  });
  if (liveAreas.some((area) => area.id === selectedArea)) machineAreaSelect.value = selectedArea;
}

function renderAreaList() {
  const expandedAreas = new Set();
  areaList.querySelectorAll("details[open]").forEach((details) => expandedAreas.add(details.dataset.areaId));
  areaList.replaceChildren();
  liveAreas.forEach((area) => {
    const item = document.createElement("li");
    item.className = "area-list-item";
    const disclosure = document.createElement("details");
    disclosure.className = "area-disclosure";
    disclosure.dataset.areaId = area.id;
    disclosure.open = expandedAreas.has(area.id);
    const summary = document.createElement("summary");
    const name = document.createElement("span");
    name.className = "area-summary-name";
    name.textContent = area.name;
    const machineCount = document.createElement("span");
    machineCount.className = "area-summary-count";
    machineCount.textContent = `${area.machines.length} ${area.machines.length === 1 ? "máquina" : "máquinas"}`;
    summary.append(name, machineCount);
    disclosure.append(summary);

    const machines = document.createElement("ul");
    machines.className = "area-machine-list";
    if (area.machines.length === 0) {
      const emptyMachine = document.createElement("li");
      emptyMachine.className = "area-machine-empty";
      emptyMachine.textContent = "No hay máquinas registradas en esta área.";
      machines.append(emptyMachine);
    }
    area.machines.forEach((machine) => {
      const machineItem = document.createElement("li");
      machineItem.className = "area-machine-item";
      const machineName = document.createElement("span");
      machineName.textContent = machine.name;
      const removeMachineButton = document.createElement("button");
      removeMachineButton.className = "area-delete";
      removeMachineButton.type = "button";
      removeMachineButton.dataset.areaId = area.id;
      removeMachineButton.dataset.machineId = machine.id;
      removeMachineButton.setAttribute("aria-label", `Eliminar máquina ${machine.name} del área ${area.name}`);
      removeMachineButton.textContent = "Eliminar máquina";
      machineItem.append(machineName, removeMachineButton);
      machines.append(machineItem);
    });
    disclosure.append(machines);

    const removeButton = document.createElement("button");
    removeButton.className = "area-delete";
    removeButton.type = "button";
    removeButton.dataset.areaId = area.id;
    removeButton.setAttribute("aria-label", `Eliminar área ${area.name}`);
    removeButton.textContent = "Eliminar";
    item.append(disclosure, removeButton);
    areaList.append(item);
  });
  document.querySelector("#area-count").textContent = String(liveAreas.length);
  document.querySelector("#area-empty").hidden = liveAreas.length > 0;
}

function loadAreas() {
  try {
    liveAreas = readAreas();
    renderAreaSelect();
    renderAreaList();
    renderMachineAreaSelect();
    areaMessage.hidden = true;
    machineMessage.hidden = true;
  } catch (error) {
    console.error("No se pudieron cargar las áreas guardadas.", error);
    liveAreas = [];
    renderAreaSelect();
    renderAreaList();
    renderMachineAreaSelect();
    areaMessage.textContent = "No se pudieron cargar las áreas guardadas. Revisa los datos locales e inténtalo de nuevo.";
    areaMessage.hidden = false;
  }
}

function readUsers() {
  const saved = localStorage.getItem(USERS_STORAGE_KEY);
  if (!saved) return [];
  const users = JSON.parse(saved);
  if (!Array.isArray(users) || users.some((user) =>
    !user || typeof user.name !== "string" || typeof user.idNumber !== "string" ||
    !isValidName(user.name) || !/^[0-9]{6,12}$/.test(normalizeIdNumber(user.idNumber)) ||
    (user.passwordSalt !== undefined && typeof user.passwordSalt !== "string") ||
    (user.passwordHash !== undefined && typeof user.passwordHash !== "string") ||
    ((user.passwordSalt === undefined) !== (user.passwordHash === undefined))
  )) {
    throw new Error("El registro de usuarios guardado tiene un formato inválido.");
  }
  const canonicalUsers = users.map((user) => ({
    name: user.name.trim().replace(/\s+/g, " "),
    idNumber: normalizeIdNumber(user.idNumber),
    ...(user.passwordSalt !== undefined ? { passwordSalt: user.passwordSalt, passwordHash: user.passwordHash } : {})
  }));
  const ids = canonicalUsers.map((user) => user.idNumber);
  if (new Set(ids).size !== ids.length) {
    throw new Error("El registro de usuarios contiene cédulas duplicadas.");
  }
  return canonicalUsers;
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function derivePasswordHash(password, salt) {
  if (!crypto.subtle || !crypto.getRandomValues) {
    throw new Error("Web Crypto no está disponible. Abre la aplicación desde localhost o una conexión HTTPS.");
  }
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt,
    iterations: PASSWORD_ITERATIONS,
    hash: "SHA-256"
  }, key, 256);
  return new Uint8Array(bits);
}

async function createPasswordCredentials(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePasswordHash(password, salt);
  return { passwordSalt: bytesToBase64(salt), passwordHash: bytesToBase64(hash) };
}

async function verifyPassword(password, account) {
  const hash = await derivePasswordHash(password, base64ToBytes(account.passwordSalt));
  const expected = base64ToBytes(account.passwordHash);
  if (hash.length !== expected.length) return false;
  let difference = 0;
  hash.forEach((byte, index) => { difference |= byte ^ expected[index]; });
  return difference === 0;
}

function readProfile(account) {
  let saved;
  try {
    saved = localStorage.getItem(`livecycle-profile-${account.idNumber}`);
  } catch (error) {
    console.error("No se pudo leer el perfil guardado.", error);
    return null;
  }
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("No se pudo leer el perfil guardado.", error);
    return null;
  }
}

function updateProfileView(profile) {
  const firstName = (profile.firstName || "").trim();
  const lastName = (profile.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toLocaleUpperCase("es") || "U";
  document.querySelector("#header-name").textContent = fullName;
  document.querySelector("#header-avatar").textContent = initials;
  document.querySelector("#header-role").textContent = `${profile.role} · ${profile.shift}`;
}

function defaultProfile(account) {
  const nameParts = account.name.trim().replace(/\s+/g, " ").split(" ");
  return {
    firstName: nameParts.shift(),
    lastName: nameParts.join(" "),
    idNumber: account.idNumber,
    email: "",
    role: "Técnico de mantenimiento",
    shift: "Turno A",
    department: "Mantenimiento",
    workArea: "Planta"
  };
}

function loadProfile(account) {
  const savedProfile = readProfile(account) || defaultProfile(account);
  for (const [name, value] of Object.entries(savedProfile)) {
    const field = profileForm.elements.namedItem(name);
    if (field) field.value = value || "";
  }
  updateProfileView(savedProfile);
}

function showDashboard(account) {
  activeAccount = account;
  authScreen.hidden = true;
  document.querySelector(".site-header").hidden = false;
  document.querySelector("main").hidden = false;
  document.querySelector(".site-footer").hidden = false;
  loadProfile(account);
  loadAreas();
  renderAccountHistory();
  renderReports();
  renderDashboard();
  showModule("dashboard");
}

function setAuthMessage(element, message, includeRegisterLink) {
  element.replaceChildren();
  if (message) element.append(document.createTextNode(message));
  if (includeRegisterLink) {
    const link = document.createElement("button");
    link.className = "auth-link";
    link.type = "button";
    link.textContent = "Ir al registro";
    link.addEventListener("click", showRegister);
    element.append(document.createTextNode(" "), link);
  }
  element.hidden = !message;
}

function showLogin() {
  registerForm.hidden = true;
  loginForm.hidden = false;
  document.querySelector("#auth-title").textContent = "Inicia sesión";
  document.querySelector("#auth-description").textContent = "Ingresa tu nombre, cédula y contraseña.";
  setAuthMessage(loginMessage, "");
  setAuthMessage(registerMessage, "");
  loginForm.elements.namedItem("name").focus();
}

function showRegister() {
  loginForm.hidden = true;
  registerForm.hidden = false;
  document.querySelector("#auth-title").textContent = "Crea tu cuenta";
  document.querySelector("#auth-description").textContent = "Registra tus datos y crea una contraseña de al menos 8 caracteres.";
  setAuthMessage(loginMessage, "");
  setAuthMessage(registerMessage, "");
  registerForm.elements.namedItem("name").focus();
}

function setNameValidity(field) {
  const valid = isValidName(field.value);
  field.setCustomValidity(valid ? "" : "Ingresa un nombre válido de al menos dos letras.");
  return valid;
}

function setIdValidity(field) {
  const valid = isValidIdNumber(field.value);
  field.setCustomValidity(valid ? "" : "La cédula solo puede contener entre 6 y 12 dígitos numéricos.");
  return valid;
}

function showAccessScreen() {
  activeAccount = null;
  document.querySelector(".site-header").hidden = true;
  document.querySelector("main").hidden = true;
  document.querySelector(".site-footer").hidden = true;
  authScreen.hidden = false;
  loginForm.reset();
  registerForm.reset();
  setAuthMessage(loginMessage, "");
  setAuthMessage(registerMessage, "");
  showLogin();
}

function initializeAuth() {
  try {
    const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) return;
    const account = readUsers().find((user) => user.idNumber === normalizeIdNumber(sessionId));
    if (account) {
      showDashboard(account);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (error) {
    console.error("No se pudo restaurar la sesión.", error);
    setAuthMessage(loginMessage, "No fue posible leer las cuentas guardadas en este navegador. Revisa el almacenamiento y vuelve a intentarlo.");
  }
}

loginForm.elements.namedItem("name").addEventListener("input", (event) => setNameValidity(event.currentTarget));
loginForm.elements.namedItem("idNumber").addEventListener("input", (event) => sanitizeIdNumberField(event.currentTarget));
registerForm.elements.namedItem("name").addEventListener("input", (event) => setNameValidity(event.currentTarget));
registerForm.elements.namedItem("idNumber").addEventListener("input", (event) => sanitizeIdNumberField(event.currentTarget));
document.querySelector("#show-register").addEventListener("click", showRegister);
document.querySelector("#show-login").addEventListener("click", showLogin);

function setAreaNameValidity() {
  const name = areaNameField.value.trim().replace(/\s+/g, " ");
  const valid = name.length >= 2 && name.length <= 80;
  areaNameField.setCustomValidity(valid ? "" : "El nombre del área debe tener entre 2 y 80 caracteres.");
  return valid;
}

function setMachineNameValidity() {
  const name = machineNameField.value.trim().replace(/\s+/g, " ");
  const valid = name.length >= 2 && name.length <= 100;
  machineNameField.setCustomValidity(valid ? "" : "El nombre de la máquina debe tener entre 2 y 100 caracteres.");
  return valid;
}

areaNameField.addEventListener("input", setAreaNameValidity);
machineNameField.addEventListener("input", setMachineNameValidity);

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthMessage(loginMessage, "");
  const nameField = loginForm.elements.namedItem("name");
  const idField = loginForm.elements.namedItem("idNumber");
  const passwordField = loginForm.elements.namedItem("password");
  const validName = setNameValidity(nameField);
  const validId = setIdValidity(idField);
  if (!validName || !validId || !loginForm.reportValidity()) {
    loginForm.reportValidity();
    return;
  }

  try {
    const users = readUsers();
    const account = users.find((user) =>
      user.idNumber === normalizeIdNumber(idField.value) &&
      normalizeName(user.name) === normalizeName(nameField.value)
    );
    if (!account) {
      setAuthMessage(loginMessage, "Usuario no encontrado o el nombre no coincide con esa cédula. Por favor, regístrate primero para continuar.", true);
      return;
    }
    if (account.passwordHash !== undefined) {
      if (!await verifyPassword(passwordField.value, account)) {
        setAuthMessage(loginMessage, "La contraseña es incorrecta.");
        return;
      }
    } else {
      const credentials = await createPasswordCredentials(passwordField.value);
      Object.assign(account, credentials);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    localStorage.setItem(SESSION_STORAGE_KEY, account.idNumber);
    showDashboard(account);
  } catch (error) {
    console.error("No se pudo validar el acceso.", error);
    setAuthMessage(loginMessage, error instanceof Error ? error.message : "No fue posible validar el acceso en este navegador.");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setAuthMessage(registerMessage, "");
  const nameField = registerForm.elements.namedItem("name");
  const idField = registerForm.elements.namedItem("idNumber");
  const passwordField = registerForm.elements.namedItem("password");
  const validName = setNameValidity(nameField);
  const validId = setIdValidity(idField);
  if (!validName || !validId || !registerForm.reportValidity()) {
    registerForm.reportValidity();
    return;
  }

  try {
    const users = readUsers();
    const idNumber = normalizeIdNumber(idField.value);
    if (users.some((user) => user.idNumber === idNumber)) {
      setAuthMessage(registerMessage, "Ya existe una cuenta registrada con esa cédula. Vuelve al acceso e ingresa el nombre asociado.");
      return;
    }
    const account = {
      name: nameField.value.trim().replace(/\s+/g, " "),
      idNumber,
      ...await createPasswordCredentials(passwordField.value)
    };
    users.push(account);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_STORAGE_KEY, account.idNumber);
    showDashboard(account);
  } catch (error) {
    console.error("No se pudo registrar la cuenta o iniciar la sesión.", error);
    setAuthMessage(registerMessage, error instanceof Error ? error.message : "No se pudo registrar la cuenta en este navegador.");
  }
});

areaForm.addEventListener("submit", (event) => {
  event.preventDefault();
  areaMessage.hidden = true;
  setAreaNameValidity();
  if (!areaForm.reportValidity()) return;

  const name = areaNameField.value.trim().replace(/\s+/g, " ");
  try {
    const areas = readAreas();
    if (areas.some((area) => normalizeAreaName(area.name) === normalizeAreaName(name))) {
      areaMessage.textContent = "Ya existe un área con ese nombre.";
      areaMessage.hidden = false;
      return;
    }

    const area = {
      id: `area-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      machines: []
    };
    localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify([...areas, area]));
    areaForm.reset();
    loadAreas();
    areaSelect.value = area.id;
    renderEvaluationMachines();
  } catch (error) {
    console.error("No se pudo guardar el área.", error);
    areaMessage.textContent = "No se pudo guardar el área en este navegador. Revisa el almacenamiento disponible e inténtalo de nuevo.";
    areaMessage.hidden = false;
  }
});

machineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  machineMessage.hidden = true;
  setMachineNameValidity();
  if (!machineForm.reportValidity()) return;

  const areaId = machineAreaSelect.value;
  const name = machineNameField.value.trim().replace(/\s+/g, " ");
  try {
    const areas = readAreas();
    const area = areas.find((item) => item.id === areaId);
    if (!area) {
      machineMessage.textContent = "Selecciona un área válida para registrar la máquina.";
      machineMessage.hidden = false;
      return;
    }
    if (area.machines.some((machine) => normalizeAreaName(machine.name) === normalizeAreaName(name))) {
      machineMessage.textContent = "Ya existe una máquina con ese nombre en el área seleccionada.";
      machineMessage.hidden = false;
      return;
    }

    const machine = {
      id: `${area.id}-machine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name
    };
    area.machines.push(machine);
    localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify(areas));
    machineForm.reset();
    loadAreas();
    areaList.querySelectorAll("details[data-area-id]").forEach((disclosure) => {
      if (disclosure.dataset.areaId === area.id) disclosure.open = true;
    });
    machineAreaSelect.value = area.id;
    areaSelect.value = area.id;
    renderEvaluationMachines();
    machineSelect.value = machine.id;
  } catch (error) {
    console.error("No se pudo guardar la máquina.", error);
    machineMessage.textContent = "No se pudo guardar la máquina en este navegador. Revisa el almacenamiento disponible e inténtalo de nuevo.";
    machineMessage.hidden = false;
  }
});

areaList.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const removeMachineButton = event.target.closest("button[data-machine-id]");
  if (removeMachineButton) {
    const area = liveAreas.find((item) => item.id === removeMachineButton.dataset.areaId);
    const machine = area && area.machines.find((item) => item.id === removeMachineButton.dataset.machineId);
    if (!area || !machine || !window.confirm(`¿Eliminar la máquina "${machine.name}" del área "${area.name}"?`)) return;

    try {
      const areas = readAreas();
      const targetArea = areas.find((item) => item.id === area.id);
      targetArea.machines = targetArea.machines.filter((item) => item.id !== machine.id);
      localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify(areas));
      loadAreas();
    } catch (error) {
      console.error("No se pudo eliminar la máquina.", error);
      machineMessage.textContent = "No se pudo eliminar la máquina. Revisa el almacenamiento local e inténtalo de nuevo.";
      machineMessage.hidden = false;
    }
    return;
  }

  const removeAreaButton = event.target.closest("button[data-area-id]");
  if (removeAreaButton) {
    const area = liveAreas.find((item) => item.id === removeAreaButton.dataset.areaId);
    if (!area || !window.confirm(`¿Eliminar el área "${area.name}" y sus ${area.machines.length} máquinas asociadas? Las evaluaciones anteriores conservarán su ubicación.`)) return;

    try {
      const remainingAreas = readAreas().filter((item) => item.id !== area.id);
      localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify(remainingAreas));
      loadAreas();
    } catch (error) {
      console.error("No se pudo eliminar el área.", error);
      areaMessage.textContent = "No se pudo eliminar el área. Revisa el almacenamiento local e inténtalo de nuevo.";
      areaMessage.hidden = false;
    }
  }
});

document.querySelectorAll("#manage-areas-link, #manage-machines-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showModule("areas");
  });
});

function showProfile() {
  profileModal.hidden = false;
  profileForm.elements.namedItem("firstName").focus();
}

function closeProfile() {
  profileModal.hidden = true;
}

document.querySelector("#profile-open").addEventListener("click", showProfile);
document.querySelector("#profile-close").addEventListener("click", closeProfile);
document.querySelector("#profile-cancel").addEventListener("click", closeProfile);
profileModal.addEventListener("click", (event) => {
  if (event.target === profileModal) closeProfile();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !profileModal.hidden) closeProfile();
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!activeAccount || !profileForm.reportValidity()) return;
  const profile = Object.fromEntries(new FormData(profileForm).entries());
  try {
    localStorage.setItem(`livecycle-profile-${activeAccount.idNumber}`, JSON.stringify(profile));
  } catch (error) {
    console.error("No se pudo guardar el perfil en este dispositivo.", error);
    alert("No se pudo guardar el perfil. Revisa el almacenamiento disponible del navegador.");
    return;
  }
  updateProfileView(profile);
  closeProfile();
});

document.querySelector("#logout-button").addEventListener("click", () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("No se pudo cerrar la sesión.", error);
    showAccessScreen();
    setAuthMessage(loginMessage, "No fue posible cerrar la sesión en este navegador. Revisa el almacenamiento local e inténtalo de nuevo.");
    return;
  }
  showAccessScreen();
});

document.querySelector("#guide-toggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const details = document.querySelector("#guide-details");
  const expanded = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!expanded));
  details.hidden = expanded;
  button.innerHTML = expanded ? 'Ver criterios <span>＋</span>' : 'Ocultar criterios <span>−</span>';
});

function getAssessment(hours, wear, component) {
  const consumed = Math.min(hours / component.life, 1);
  const wearPenalty = [0, 0.18, 0.45][wear];
  const remaining = Math.max(0, Math.round((1 - consumed - wearPenalty) * 100));
  if (remaining <= 10 || wear === 2) {
    return {
      remaining,
      className: "result-critical",
      title: "Reemplazo inmediato",
      copy: "Se observa una condición crítica. Detén y revisa el equipo según el procedimiento de seguridad antes de continuar."
    };
  }
  if (remaining <= 30) {
    return {
      remaining,
      className: "result-warn",
      title: "Reacondicionar",
      copy: "El desgaste requiere intervención planificada. Programa reacondicionamiento y valida la condición antes de liberar el equipo."
    };
  }
  return {
    remaining,
    className: "result-good",
    title: "Apto para preventivo",
    copy: "El componente puede continuar en operación. Mantén su inspección dentro del plan preventivo."
  };
}

function setDictamen(component, hours, wear, location) {
  const assessment = getAssessment(hours, wear, component);
  const nextHours = Math.max(250, Math.round((component.life * assessment.remaining / 100) * 0.15 / 250) * 250);
  const now = new Date();
  const code = `LC-${now.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const record = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    date: now.toISOString(),
    code,
    component: component.name,
    componentId: component.id,
    category: component.category,
    hours,
    wear,
    area: location.areaName,
    machine: location.machine,
    remaining: assessment.remaining,
    assessmentClass: assessment.className,
    recommendation: assessment.title,
    technician: activeAccount.name,
    nextInspection: assessment.remaining <= 10 ? "Antes de reiniciar" : `En ${nextHours.toLocaleString("es-ES")} h`
  };

  try {
    const records = readAccountAudits();
    records.unshift(record);
    localStorage.setItem(`${AUDIT_STORAGE_PREFIX}${activeAccount.idNumber}`, JSON.stringify(records));
  } catch (error) {
    console.error("No se pudo guardar la evaluación.", error);
    alert("No se pudo guardar la evaluación en este navegador. Revisa el almacenamiento disponible e inténtalo de nuevo.");
    return;
  }

  const resultCard = document.querySelector("#result-card");
  resultCard.classList.remove("result-good", "result-warn", "result-critical");
  resultCard.classList.add(assessment.className);
  document.querySelector("#life-gauge").style.setProperty("--life", assessment.remaining);
  document.querySelector("#remaining-value").innerHTML = `${assessment.remaining}<span>%</span>`;
  document.querySelector("#recommendation-title").textContent = assessment.title;
  document.querySelector("#recommendation-copy").textContent = assessment.copy;
  document.querySelector("#result-component").textContent = `${component.name} · ${component.id}`;
  document.querySelector("#result-location").textContent = `${location.areaName} · ${location.machine}`;
  document.querySelector("#next-inspection").textContent = record.nextInspection;
  document.querySelector("#result-code").textContent = code;
  renderAccountHistory();
  renderReports();
  renderDashboard();
}

function isValidAuditRecord(record) {
  return Boolean(record && typeof record.id === "string" && typeof record.date === "string" &&
    Number.isFinite(Date.parse(record.date)) && typeof record.code === "string" &&
    typeof record.component === "string" && typeof record.componentId === "string" &&
    typeof record.area === "string" && typeof record.machine === "string" &&
    Number.isFinite(record.hours) && Number.isInteger(record.wear) && record.wear >= 0 && record.wear <= 2 &&
    Number.isInteger(record.remaining) && record.remaining >= 0 && record.remaining <= 100 &&
    ["result-good", "result-warn", "result-critical"].includes(record.assessmentClass) &&
    typeof record.recommendation === "string" && typeof record.technician === "string");
}

function readAuditRecords(storageKey) {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];
  const records = JSON.parse(saved);
  if (!Array.isArray(records) || records.some((record) => !isValidAuditRecord(record))) {
    throw new Error(`El historial guardado en "${storageKey}" tiene un formato inválido.`);
  }
  return records;
}

function readAccountAudits() {
  if (!activeAccount) throw new Error("No hay una cuenta activa para consultar el historial.");
  return readAuditRecords(`${AUDIT_STORAGE_PREFIX}${activeAccount.idNumber}`);
}

function readAllAudits() {
  const storageKeys = Object.keys(localStorage).filter((key) => key.startsWith(AUDIT_STORAGE_PREFIX));
  return storageKeys.flatMap((key) => readAuditRecords(key))
    .sort((first, second) => Date.parse(second.date) - Date.parse(first.date));
}

function formatAuditDate(value) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(new Date(value)).replace(",", " ·");
}

function createTableStatus(record) {
  const badge = document.createElement("span");
  const statusClass = record.assessmentClass === "result-critical" ? "status-critical"
    : record.assessmentClass === "result-warn" ? "status-repair" : "status-good";
  badge.className = `table-status ${statusClass}`;
  badge.textContent = record.recommendation;
  return badge;
}

function createTableCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function renderAccountHistory() {
  const emptyHistory = document.querySelector("#empty-history");
  try {
    const records = readAccountAudits();
    historyRows.replaceChildren();
    records.forEach((record) => {
      const row = document.createElement("tr");
      [
        formatAuditDate(record.date),
        record.component,
        record.componentId,
        record.area,
        record.machine,
        `${record.hours.toLocaleString("es-ES")} h`
      ].forEach((value) => row.append(createTableCell(value)));

      const wearCell = document.createElement("td");
      const wearBadge = document.createElement("span");
      wearBadge.className = `wear-pill ${record.wear === 0 ? "wear-low" : record.wear === 1 ? "wear-mid" : "status-critical"}`;
      wearBadge.textContent = ["Sin desgaste", "Moderado", "Crítico"][record.wear];
      wearCell.append(wearBadge);
      row.append(wearCell, createTableStatus(record), createTableCell(`${record.remaining}%`), createTableCell(record.technician));
      historyRows.append(row);
    });
    emptyHistory.hidden = records.length > 0;
  } catch (error) {
    console.error("No se pudo cargar el historial de auditoría.", error);
    historyRows.replaceChildren();
    emptyHistory.textContent = "No se pudo leer el historial guardado. Revisa los datos locales.";
    emptyHistory.hidden = false;
  }
}

function renderDashboard() {
  const message = document.querySelector("#dashboard-message");
  try {
    const records = readAllAudits();
    const criticalCount = records.filter((record) => record.assessmentClass === "result-critical").length;
    const average = records.length
      ? `${Math.round(records.reduce((sum, record) => sum + record.remaining, 0) / records.length)}%`
      : "—";
    const machines = new Set(records.map((record) => `${normalizeSearch(record.area)}|${normalizeSearch(record.machine)}`));
    document.querySelector("#metric-total").textContent = records.length.toLocaleString("es-ES");
    document.querySelector("#metric-critical").textContent = criticalCount.toLocaleString("es-ES");
    document.querySelector("#metric-average").textContent = average;
    document.querySelector("#metric-machines").textContent = machines.size.toLocaleString("es-ES");

    const dashboardRows = document.querySelector("#dashboard-rows");
    dashboardRows.replaceChildren();
    records.slice(0, 5).forEach((record) => {
      const row = document.createElement("tr");
      [
        formatAuditDate(record.date),
        record.component,
        `${record.area} · ${record.machine}`
      ].forEach((value) => row.append(createTableCell(value)));
      const statusCell = document.createElement("td");
      statusCell.append(createTableStatus(record));
      row.append(statusCell, createTableCell(`${record.remaining}%`));
      dashboardRows.append(row);
    });
    document.querySelector("#dashboard-empty").hidden = records.length > 0;
    message.hidden = true;
  } catch (error) {
    console.error("No se pudieron calcular las métricas globales.", error);
    document.querySelector("#metric-total").textContent = "—";
    document.querySelector("#metric-critical").textContent = "—";
    document.querySelector("#metric-average").textContent = "—";
    document.querySelector("#metric-machines").textContent = "—";
    document.querySelector("#dashboard-rows").replaceChildren();
    document.querySelector("#dashboard-empty").textContent = "No se pueden mostrar los datos mientras exista un historial inválido.";
    document.querySelector("#dashboard-empty").hidden = false;
    message.textContent = "No se pudieron calcular las métricas: revisa los historiales guardados en este navegador.";
    message.hidden = false;
  }
}

function getLocalDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getFilteredReportRecords() {
  const from = document.querySelector("#report-from").value;
  const to = document.querySelector("#report-to").value;
  const status = document.querySelector("#report-status").value;
  return readAccountAudits().filter((record) => {
    const date = getLocalDate(record.date);
    return (!from || date >= from) && (!to || date <= to) && (!status || record.assessmentClass === status);
  });
}

function renderReports() {
  const message = document.querySelector("#report-message");
  try {
    const records = getFilteredReportRecords();
    reportRows.replaceChildren();
    records.forEach((record) => {
      const row = document.createElement("tr");
      [
        formatAuditDate(record.date),
        record.code,
        record.component,
        `${record.area} · ${record.machine}`
      ].forEach((value) => row.append(createTableCell(value)));
      const statusCell = document.createElement("td");
      statusCell.append(createTableStatus(record));
      row.append(statusCell, createTableCell(`${record.remaining}%`), createTableCell(record.technician));
      reportRows.append(row);
    });
    document.querySelector("#report-count").textContent = `${records.length} ${records.length === 1 ? "registro" : "registros"}`;
    document.querySelector("#report-empty").hidden = records.length > 0;
    document.querySelector("#export-report").disabled = records.length === 0;
    message.hidden = true;
  } catch (error) {
    console.error("No se pudo preparar el reporte.", error);
    reportRows.replaceChildren();
    document.querySelector("#report-count").textContent = "Error al leer";
    document.querySelector("#report-empty").hidden = false;
    document.querySelector("#export-report").disabled = true;
    message.textContent = "No se pudo preparar el reporte porque el historial guardado tiene un formato inválido.";
    message.hidden = false;
  }
}

function exportReport() {
  let records;
  try {
    records = getFilteredReportRecords();
  } catch (error) {
    console.error("No se pudo exportar el reporte.", error);
    alert("No se pudo leer el historial guardado; no se generó el archivo.");
    return;
  }
  if (!records.length) return;

  const headers = ["Fecha y hora", "Código", "Componente", "Referencia", "Área", "Máquina", "Horas", "Desgaste", "Dictamen", "Vida restante (%)", "Técnico"];
  const csvValue = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const rows = records.map((record) => [
    formatAuditDate(record.date),
    record.code,
    record.component,
    record.componentId,
    record.area,
    record.machine,
    record.hours,
    ["Sin desgaste", "Moderado", "Crítico"][record.wear],
    record.recommendation,
    record.remaining,
    record.technician
  ]);
  const safeCsvValue = (value) => {
    const text = String(value);
    const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return csvValue(safeText);
  };
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(safeCsvValue).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `livecycle-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

evaluationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!evaluationForm.reportValidity()) return;
  const component = liveCycleCatalog.find((part) => part.id === componentSelect.value);
  const area = liveAreas.find((item) => item.id === areaSelect.value);
  const machine = area && area.machines.find((item) => item.id === machineSelect.value);
  const hours = Number(document.querySelector("#hours").value);
  const wear = Number(document.querySelector("#wear").value);
  if (!component || !Number.isFinite(component.life) || component.life <= 0 ||
      !area || !machine || !Number.isFinite(hours) || hours < 0 ||
      !Number.isInteger(wear) || wear < 0 || wear > 2) {
    alert("Verifica la pieza, el área, la máquina, las horas de operación y el nivel de desgaste ingresados.");
    return;
  }
  setDictamen(component, hours, wear, { areaName: area.name, machine: machine.name });
});

document.querySelector("#clear-history").addEventListener("click", () => {
  if (!activeAccount || !window.confirm("¿Eliminar de forma permanente el historial de tu cuenta en este navegador?")) return;
  try {
    localStorage.removeItem(`${AUDIT_STORAGE_PREFIX}${activeAccount.idNumber}`);
    renderAccountHistory();
    renderReports();
    renderDashboard();
  } catch (error) {
    console.error("No se pudo limpiar el historial.", error);
    alert("No se pudo limpiar el historial. Revisa el almacenamiento local e inténtalo de nuevo.");
  }
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showModule(link.hash.slice(1));
  });
});

document.querySelector("#dashboard-evaluate").addEventListener("click", () => {
  showModule("evaluacion");
  if (!componentSearch.disabled) componentSearch.focus();
});
document.querySelector("#dashboard-history").addEventListener("click", () => showModule("historial"));
document.querySelector("#export-report").addEventListener("click", exportReport);
["#report-from", "#report-to"].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", renderReports);
});
document.querySelector("#report-status").addEventListener("change", renderReports);

componentSearch.addEventListener("input", renderEvaluationComponents);
areaSelect.addEventListener("change", renderEvaluationMachines);
document.querySelector("#back-to-evaluador").addEventListener("click", () => showModule("evaluador"));

function showModule(moduleName) {
  const moduleExists = document.querySelector(`[data-module="${moduleName}"]`);
  if (!moduleExists) return;

  const activeModule = moduleName === "evaluacion" ? "evaluador" : moduleName;
  document.querySelectorAll("[data-module]").forEach((section) => {
    section.hidden = section.dataset.module !== moduleName;
  });
  document.querySelectorAll(".nav-link").forEach((link) => {
    const active = link.hash.slice(1) === activeModule;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  history.replaceState(null, "", `#${activeModule}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelector(".hero-cta").addEventListener("click", (event) => {
  event.preventDefault();
  showModule("evaluacion");
  if (!componentSearch.disabled) componentSearch.focus();
});

document.querySelectorAll(".brand, .footer-brand").forEach((brandLink) => {
  brandLink.addEventListener("click", (event) => {
    event.preventDefault();
    showModule("evaluador");
  });
});

const requestedModule = window.location.hash.slice(1);
initializeAuth();
catalogSearch.addEventListener("input", renderCatalog);
catalogCategory.addEventListener("change", renderCatalog);
loadCatalog();
if (activeAccount) {
  showModule(["dashboard", "evaluador", "evaluacion", "catalogo", "historial", "reportes", "areas"].includes(requestedModule)
    ? requestedModule
    : "dashboard");
}
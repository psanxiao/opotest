export async function fetchTemas() {
  const res = await fetch('/api/temas');
  if (!res.ok) {
    throw new Error('Error al cargar temas');
  }
  return res.json();
}

export async function uploadTemaPDF(file, title) {
  const formData = new FormData();
  formData.append('file', file);
  if (title && title.trim()) {
    formData.append('titulo', title.trim());
  }

  const res = await fetch('/api/temas', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al subir el archivo PDF');
  }

  return res.json();
}

export async function deleteTema(id) {
  const res = await fetch(`/api/temas/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al eliminar el tema');
  }

  return res.json();
}

export async function createExamen(payload) {
  const res = await fetch('/api/examenes/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al crear el examen');
  }

  return res.json();
}

export async function fetchExamen(id) {
  const res = await fetch(`/api/examenes/${id}`);
  if (!res.ok) {
    throw new Error('Error al cargar el examen');
  }
  return res.json();
}

export async function saveExamenProgress(id, payload) {
  const res = await fetch(`/api/examenes/${id}/guardar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Error al guardar progreso');
  }

  return res.json();
}

export async function finishExamen(id) {
  const res = await fetch(`/api/examenes/${id}/finalizar`, {
    method: 'POST',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al finalizar el examen');
  }

  return res.json();
}

export async function fetchHistorial() {
  const res = await fetch('/api/historial');
  if (!res.ok) {
    throw new Error('Error al cargar el historial');
  }
  return res.json();
}

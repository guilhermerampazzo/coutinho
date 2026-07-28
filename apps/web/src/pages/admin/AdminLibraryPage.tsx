import { useEffect, useState } from "react";
import { Badge, Button, Card, TextField } from "@couthealth/ui";
import { libraryApi, type LibraryItem } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AdminLayout } from "./AdminLayout";

const types: LibraryItem["type"][] = ["RECEITA", "ARTIGO", "VIDEO", "MATERIAL"];

export function AdminLibraryPage() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LibraryItem["type"]>("ARTIGO");
  const [mediaUrl, setMediaUrl] = useState("");

  function load() {
    if (!accessToken) return;
    libraryApi.listAll(accessToken).then(setItems);
  }

  useEffect(load, [accessToken]);

  async function create() {
    if (!accessToken || !title) return;
    await libraryApi.create({ title, type, mediaUrl }, accessToken);
    setTitle("");
    setMediaUrl("");
    load();
  }

  async function publish(id: string) {
    if (!accessToken) return;
    await libraryApi.publish(id, accessToken);
    load();
  }

  return (
    <AdminLayout title="Biblioteca">
      <Card style={{ marginBottom: "var(--sp-6)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--sp-3)", alignItems: "end" }}>
        <TextField label="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label style={{ fontSize: "var(--fs-body-sm)", fontWeight: 600, color: "var(--text-secondary)" }}>Tipo</label>
          <select value={type} onChange={(e) => setType(e.target.value as LibraryItem["type"])} style={{ display: "block", width: "100%", marginTop: 8, background: "var(--bg-base)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-md)", padding: "12px 16px", color: "var(--text-primary)" }}>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <TextField label="URL (vídeo/material)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
        <Button onClick={create} style={{ borderRadius: "var(--r-full)" }}>
          + Adicionar
        </Button>
      </Card>

      <div className="admin-table-wrap" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-hairline)", borderRadius: "var(--r-lg)" }}>
        <div style={{ minWidth: 480 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr auto",
              alignItems: "center",
              gap: "var(--sp-3)",
              padding: "12px var(--sp-4)",
              background: "var(--bg-base)",
              fontSize: "var(--fs-caption)",
              color: "var(--text-tertiary)",
              fontWeight: 500,
            }}
          >
            <span>Título</span>
            <span>Tipo</span>
            <span>Status</span>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr auto",
                alignItems: "center",
                gap: "var(--sp-3)",
                padding: "12px var(--sp-4)",
                borderTop: "1px solid var(--border-hairline)",
                fontSize: "var(--fs-body-sm)",
              }}
            >
              <span>{item.title}</span>
              <span style={{ color: "var(--text-tertiary)" }}>{item.type}</span>
              {item.publishedAt ? (
                <Badge tone="accent">Publicado</Badge>
              ) : (
                <Button variant="secondary" onClick={() => publish(item.id)}>
                  Publicar
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

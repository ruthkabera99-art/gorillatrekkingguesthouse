import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Plus, Save, RotateCcw, Eye, EyeOff, Upload, ExternalLink } from "lucide-react";
import {
  DEFAULT_CONTENT, SECTION_LABELS, fetchSiteContent, saveSiteContent, newId,
  type SiteContent, type LText,
} from "@/hooks/useSiteContent";

const LANGS = [["en", "English"], ["fr", "Français"], ["es", "Español"]] as const;
const SERIF_FONTS = ["Playfair Display", "Cormorant Garamond", "Lora", "Libre Baskerville", "DM Serif Display", "Merriweather"];
const SANS_FONTS = ["Inter", "Work Sans", "Manrope", "Nunito Sans", "Karla", "DM Sans", "Lato"];

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** One text box per language. Empty boxes use the built-in translation. */
const LField = ({ label, value, onChange, multiline, hint }: { label: string; value: LText; onChange: (v: LText) => void; multiline?: boolean; hint?: string }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <div className="grid gap-2 md:grid-cols-3">
      {LANGS.map(([code, name]) => {
        const props = {
          value: value?.[code] ?? "",
          placeholder: `${name}${hint ? ` — ${hint}` : ""}`,
          onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange({ ...value, [code]: e.target.value }),
        };
        return (
          <div key={code} className="relative">
            <span className="absolute right-2 top-2 text-[10px] uppercase text-muted-foreground pointer-events-none">{code}</span>
            {multiline ? <Textarea rows={2} {...props} /> : <Input {...props} />}
          </div>
        );
      })}
    </div>
  </div>
);

const RowButtons = ({ onUp, onDown, onDelete }: { onUp: () => void; onDown: () => void; onDelete: () => void }) => (
  <div className="flex gap-1 shrink-0">
    <Button type="button" size="icon" variant="ghost" onClick={onUp} aria-label="Move up"><ArrowUp size={16} /></Button>
    <Button type="button" size="icon" variant="ghost" onClick={onDown} aria-label="Move down"><ArrowDown size={16} /></Button>
    <Button type="button" size="icon" variant="ghost" onClick={onDelete} aria-label="Delete" className="text-destructive"><Trash2 size={16} /></Button>
  </div>
);

const AdminSiteContent = () => {
  const [c, setC] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchSiteContent().then(setC); }, []);

  if (!c) return <div className="p-8 text-muted-foreground">Loading…</div>;

  const update = <K extends keyof SiteContent>(key: K, patch: Partial<SiteContent[K]> | SiteContent[K]) => {
    setC((prev) => prev && ({ ...prev, [key]: Array.isArray(patch) ? patch : { ...(prev[key] as object), ...patch } }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveSiteContent(c);
      setDirty(false);
      toast.success("Website updated — visitors see the changes now");
    } catch (e) {
      toast.error(`Could not save: ${(e as Error).message}`);
    } finally { setSaving(false); }
  };

  const reset = (key: keyof SiteContent) => {
    if (!confirm("Put this part back to the original design? (You still need to press Save.)")) return;
    update(key, JSON.parse(JSON.stringify(DEFAULT_CONTENT[key])));
  };

  const uploadHero = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Photo must be under 5 MB"); return; }
    setUploading(true);
    const path = `site/hero-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("room-images").upload(path, file);
    if (error) { toast.error(`Upload failed: ${error.message}`); setUploading(false); return; }
    const { data } = supabase.storage.from("room-images").getPublicUrl(path);
    update("hero", { imageUrl: data.publicUrl });
    setUploading(false);
    toast.success("Photo uploaded — press Save to publish it");
  };

  const { header, banner, hero, footer, theme, sections } = c;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold">Website Design</h2>
          <p className="text-sm text-muted-foreground">Edit the header menu, banner, hero, footer, colours and home page sections. Empty language boxes use the built-in text.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><a href="/" target="_blank" rel="noreferrer"><ExternalLink size={16} className="mr-2" />View site</a></Button>
          <Button onClick={save} disabled={saving || !dirty}><Save size={16} className="mr-2" />{saving ? "Saving…" : dirty ? "Save changes" : "Saved"}</Button>
        </div>
      </div>

      <Tabs defaultValue="header">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="header">Header menu</TabsTrigger>
          <TabsTrigger value="banner">Banner</TabsTrigger>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="theme">Colours & fonts</TabsTrigger>
          <TabsTrigger value="sections">Home sections</TabsTrigger>
        </TabsList>

        {/* HEADER */}
        <TabsContent value="header">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div><CardTitle>Header menu</CardTitle><CardDescription>Links at the top of the website. Use "#rooms" to jump to a home section or "/menu" for a page.</CardDescription></div>
              <Button variant="ghost" size="sm" onClick={() => reset("header")}><RotateCcw size={14} className="mr-1" />Reset</Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Logo title</Label><Input value={header.brandTitle} onChange={(e) => update("header", { brandTitle: e.target.value })} /></div>
                <div><Label>Logo subtitle</Label><Input value={header.brandSubtitle} onChange={(e) => update("header", { brandSubtitle: e.target.value })} /></div>
              </div>
              <div className="space-y-3">
                {header.links.map((l, i) => (
                  <div key={l.id} className={`rounded-lg border p-3 space-y-2 ${l.visible ? "" : "opacity-60"}`}>
                    <div className="flex items-center gap-2">
                      <Input className="max-w-[220px]" value={l.href} placeholder="#section or /page or https://…"
                        onChange={(e) => update("header", { links: header.links.map((x) => x.id === l.id ? { ...x, href: e.target.value } : x) })} />
                      <Button type="button" size="sm" variant="ghost" onClick={() => update("header", { links: header.links.map((x) => x.id === l.id ? { ...x, visible: !x.visible } : x) })}>
                        {l.visible ? <><Eye size={14} className="mr-1" />Shown</> : <><EyeOff size={14} className="mr-1" />Hidden</>}
                      </Button>
                      <div className="flex-1" />
                      <RowButtons
                        onUp={() => update("header", { links: move(header.links, i, -1) })}
                        onDown={() => update("header", { links: move(header.links, i, 1) })}
                        onDelete={() => update("header", { links: header.links.filter((x) => x.id !== l.id) })}
                      />
                    </div>
                    <LField label="Label" value={l.label} hint={l.tKey ? "built-in" : undefined}
                      onChange={(v) => update("header", { links: header.links.map((x) => x.id === l.id ? { ...x, label: v } : x) })} />
                  </div>
                ))}
                <Button variant="outline" onClick={() => update("header", { links: [...header.links, { id: newId(), label: { en: "New link" }, href: "/", visible: true }] })}>
                  <Plus size={16} className="mr-1" />Add link
                </Button>
              </div>
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center gap-3"><Switch checked={header.showBookButton} onCheckedChange={(v) => update("header", { showBookButton: v })} /><Label>Show "Book Now" button</Label></div>
                <div className="max-w-xs"><Label>Button goes to</Label><Input value={header.bookHref} onChange={(e) => update("header", { bookHref: e.target.value })} /></div>
                <LField label="Button text" value={header.bookLabel} hint="built-in" onChange={(v) => update("header", { bookLabel: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BANNER */}
        <TabsContent value="banner">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div><CardTitle>Announcement banner</CardTitle><CardDescription>The gold strip at the very top of every page.</CardDescription></div>
              <Button variant="ghost" size="sm" onClick={() => reset("banner")}><RotateCcw size={14} className="mr-1" />Reset</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3"><Switch checked={banner.enabled} onCheckedChange={(v) => update("banner", { enabled: v })} /><Label>Show banner</Label></div>
              <LField label="Bold highlight (e.g. Save 20%)" value={banner.highlight} onChange={(v) => update("banner", { highlight: v })} />
              <LField label="Message" value={banner.text} multiline onChange={(v) => update("banner", { text: v })} />
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Offer ends (countdown — leave empty for none)</Label>
                  <Input type="datetime-local" value={banner.endDate ? banner.endDate.slice(0, 16) : ""}
                    onChange={(e) => update("banner", { endDate: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
                  <p className="text-xs text-muted-foreground mt-1">The banner hides itself automatically after this time.</p>
                </div>
                <div><Label>Clicking the banner goes to</Label><Input value={banner.linkHref} placeholder="/rooms" onChange={(e) => update("banner", { linkHref: e.target.value })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HERO */}
        <TabsContent value="hero">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div><CardTitle>Hero</CardTitle><CardDescription>The big picture and headline at the top of the home page.</CardDescription></div>
              <Button variant="ghost" size="sm" onClick={() => reset("hero")}><RotateCcw size={14} className="mr-1" />Reset</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[240px_1fr] items-start">
                <div className="aspect-video rounded-lg overflow-hidden bg-muted border">
                  {hero.imageUrl && <img src={hero.imageUrl} alt="Hero preview" className="w-full h-full object-cover" />}
                </div>
                <div className="space-y-3">
                  <div><Label>Background photo link</Label><Input value={hero.imageUrl} onChange={(e) => update("hero", { imageUrl: e.target.value })} /></div>
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <label className="cursor-pointer"><Upload size={14} className="mr-1" />{uploading ? "Uploading…" : "Upload photo"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadHero(e.target.files[0])} />
                    </label>
                  </Button>
                  <div><Label>Background video link (.mp4 — leave empty to show only the photo)</Label><Input value={hero.videoUrl} onChange={(e) => update("hero", { videoUrl: e.target.value })} /></div>
                </div>
              </div>
              <LField label="Small badge above title" value={hero.badge} hint="built-in" onChange={(v) => update("hero", { badge: v })} />
              <LField label="Title line 1" value={hero.title1} hint="built-in" onChange={(v) => update("hero", { title1: v })} />
              <LField label="Title line 2 (gold)" value={hero.title2} hint="built-in" onChange={(v) => update("hero", { title2: v })} />
              <LField label="Subtitle" value={hero.subtitle} hint="built-in" multiline onChange={(v) => update("hero", { subtitle: v })} />
              <LField label="Location line" value={hero.location} hint="built-in" onChange={(v) => update("hero", { location: v })} />
              <div className="grid gap-3 md:grid-cols-2 items-end">
                <div><Label>Rating shown</Label><Input value={hero.rating} onChange={(e) => update("hero", { rating: e.target.value })} /></div>
                <div className="flex items-center gap-3 pb-2"><Switch checked={hero.showSearch} onCheckedChange={(v) => update("hero", { showSearch: v })} /><Label>Show booking search box</Label></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FOOTER */}
        <TabsContent value="footer">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div><CardTitle>Footer</CardTitle><CardDescription>The bottom of every page.</CardDescription></div>
              <Button variant="ghost" size="sm" onClick={() => reset("footer")}><RotateCcw size={14} className="mr-1" />Reset</Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Name</Label><Input value={footer.brandTitle} onChange={(e) => update("footer", { brandTitle: e.target.value })} /></div>
                <div><Label>Name subtitle</Label><Input value={footer.brandSubtitle} onChange={(e) => update("footer", { brandSubtitle: e.target.value })} /></div>
              </div>
              <LField label="Short description" value={footer.tagline} hint="built-in" multiline onChange={(v) => update("footer", { tagline: v })} />

              <div>
                <Label>Social media links (empty = hidden)</Label>
                <div className="grid gap-2 md:grid-cols-2 mt-1.5">
                  {(Object.keys(footer.socials) as (keyof typeof footer.socials)[]).map((k) => (
                    <Input key={k} placeholder={`${k[0].toUpperCase()}${k.slice(1)} page link`} value={footer.socials[k]}
                      onChange={(e) => update("footer", { socials: { ...footer.socials, [k]: e.target.value } })} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Link columns</Label>
                {footer.columns.map((col, ci) => {
                  const setCol = (patch: Partial<typeof col>) => update("footer", { columns: footer.columns.map((x) => x.id === col.id ? { ...x, ...patch } : x) });
                  return (
                    <div key={col.id} className="rounded-lg border p-3 space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1"><LField label={`Column ${ci + 1} title`} value={col.title} hint={col.tKey ? "built-in" : undefined} onChange={(v) => setCol({ title: v })} /></div>
                        <RowButtons
                          onUp={() => update("footer", { columns: move(footer.columns, ci, -1) })}
                          onDown={() => update("footer", { columns: move(footer.columns, ci, 1) })}
                          onDelete={() => confirm("Delete this whole column?") && update("footer", { columns: footer.columns.filter((x) => x.id !== col.id) })}
                        />
                      </div>
                      {col.links.map((l, li) => (
                        <div key={l.id} className="pl-3 border-l-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input className="max-w-[260px]" value={l.href} placeholder="/page, #section or https://…"
                              onChange={(e) => setCol({ links: col.links.map((x) => x.id === l.id ? { ...x, href: e.target.value } : x) })} />
                            <div className="flex-1" />
                            <RowButtons
                              onUp={() => setCol({ links: move(col.links, li, -1) })}
                              onDown={() => setCol({ links: move(col.links, li, 1) })}
                              onDelete={() => setCol({ links: col.links.filter((x) => x.id !== l.id) })}
                            />
                          </div>
                          <LField label="Link text" value={l.label} onChange={(v) => setCol({ links: col.links.map((x) => x.id === l.id ? { ...x, label: v } : x) })} />
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => setCol({ links: [...col.links, { id: newId(), label: { en: "New link" }, href: "#" }] })}><Plus size={14} className="mr-1" />Add link</Button>
                    </div>
                  );
                })}
                <Button variant="outline" onClick={() => update("footer", { columns: [...footer.columns, { id: newId(), title: { en: "New column" }, links: [] }] })}><Plus size={16} className="mr-1" />Add column</Button>
              </div>

              <div className="space-y-2">
                <Label>"Find us on" booking sites</Label>
                {footer.otaLinks.map((o, i) => (
                  <div key={o.id} className="flex gap-2">
                    <Input className="max-w-[180px]" value={o.name} placeholder="Name" onChange={(e) => update("footer", { otaLinks: footer.otaLinks.map((x) => x.id === o.id ? { ...x, name: e.target.value } : x) })} />
                    <Input value={o.href} placeholder="Listing link (https://…)" onChange={(e) => update("footer", { otaLinks: footer.otaLinks.map((x) => x.id === o.id ? { ...x, href: e.target.value } : x) })} />
                    <RowButtons
                      onUp={() => update("footer", { otaLinks: move(footer.otaLinks, i, -1) })}
                      onDown={() => update("footer", { otaLinks: move(footer.otaLinks, i, 1) })}
                      onDelete={() => update("footer", { otaLinks: footer.otaLinks.filter((x) => x.id !== o.id) })}
                    />
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => update("footer", { otaLinks: [...footer.otaLinks, { id: newId(), name: "", href: "" }] })}><Plus size={14} className="mr-1" />Add site</Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Copyright name</Label><Input value={footer.copyright} onChange={(e) => update("footer", { copyright: e.target.value })} /></div>
                <div><Label>Bottom note</Label><Input value={footer.bottomNote} onChange={(e) => update("footer", { bottomNote: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-3"><Switch checked={footer.showNewsletter} onCheckedChange={(v) => update("footer", { showNewsletter: v })} /><Label>Show newsletter box</Label></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* THEME */}
        <TabsContent value="theme">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div><CardTitle>Colours & fonts</CardTitle><CardDescription>Changes the look of the whole website and admin panel.</CardDescription></div>
              <Button variant="ghost" size="sm" onClick={() => reset("theme")}><RotateCcw size={14} className="mr-1" />Reset</Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                {([["primary", "Main colour (gold)"], ["secondary", "Dark colour (footer, navy)"], ["button", "Book button colour"]] as const).map(([k, label]) => (
                  <div key={k}>
                    <Label>{label}</Label>
                    <div className="flex gap-2 mt-1.5">
                      <input type="color" value={theme[k]} onChange={(e) => update("theme", { [k]: e.target.value })} className="h-10 w-14 rounded border cursor-pointer bg-transparent" aria-label={label} />
                      <Input value={theme[k]} onChange={(e) => update("theme", { [k]: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Heading font</Label>
                  <Select value={theme.fontSerif} onValueChange={(v) => update("theme", { fontSerif: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{SERIF_FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Body font</Label>
                  <Select value={theme.fontSans} onValueChange={(v) => update("theme", { fontSans: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{SANS_FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Corner roundness: {theme.radius.toFixed(2)}</Label>
                  <input type="range" min={0} max={1.5} step={0.05} value={theme.radius} onChange={(e) => update("theme", { radius: Number(e.target.value) })} className="w-full mt-3 accent-primary" />
                </div>
              </div>
              <div className="rounded-xl border p-5 space-y-3" style={{ fontFamily: `"${theme.fontSans}"` }}>
                <p className="text-xs uppercase text-muted-foreground">Preview (after saving, the whole site updates)</p>
                <h3 className="text-2xl font-bold" style={{ fontFamily: `"${theme.fontSerif}"`, color: theme.primary }}>Gorilla Trekking Guest House</h3>
                <p className="text-sm">Authentic Rwandan hospitality near Volcanoes National Park.</p>
                <div className="flex gap-2">
                  <span className="px-4 py-2 text-sm font-semibold" style={{ background: theme.button, color: "#fff", borderRadius: `${theme.radius}rem` }}>Book Now</span>
                  <span className="px-4 py-2 text-sm" style={{ background: theme.secondary, color: "#fff", borderRadius: `${theme.radius}rem` }}>Footer colour</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTIONS */}
        <TabsContent value="sections">
          <Card>
            <CardHeader className="flex-row items-start justify-between">
              <div><CardTitle>Home page sections</CardTitle><CardDescription>Turn sections on or off and change their order.</CardDescription></div>
              <Button variant="ghost" size="sm" onClick={() => reset("sections")}><RotateCcw size={14} className="mr-1" />Reset</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((s, i) => (
                <div key={s.key} className={`flex items-center gap-3 rounded-lg border p-3 ${s.visible ? "" : "opacity-60"}`}>
                  <span className="w-6 text-sm text-muted-foreground">{i + 1}</span>
                  <Switch checked={s.visible} onCheckedChange={(v) => update("sections", sections.map((x) => x.key === s.key ? { ...x, visible: v } : x))} />
                  <span className="flex-1 font-medium">{SECTION_LABELS[s.key]}</span>
                  <Button size="icon" variant="ghost" onClick={() => update("sections", move(sections, i, -1))} aria-label="Move up"><ArrowUp size={16} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => update("sections", move(sections, i, 1))} aria-label="Move down"><ArrowDown size={16} /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button size="lg" onClick={save} disabled={saving} className="shadow-xl"><Save size={16} className="mr-2" />{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      )}
    </div>
  );
};

export default AdminSiteContent;

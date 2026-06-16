"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Pencil, Plus, Save, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { adminFieldClass, deleteAdminJson, patchAdminJson, postAdminJson } from "@/components/admin/admin-form-utils";
import type { VehicleModel, VehicleStory, VehicleStoryMedia, VehicleStoryUpdate } from "@/types/automobile";

const LAUNCH_STATUS_OPTIONS: { value: VehicleStory["launchStatus"]; label: string; color: string }[] = [
  { value: "upcoming", label: "Upcoming", color: "bg-amber-100 text-amber-800" },
  { value: "launched", label: "Launched", color: "bg-emerald-100 text-emerald-800" },
  { value: "updated", label: "Updated", color: "bg-blue-100 text-blue-800" },
  { value: "discontinued", label: "Discontinued", color: "bg-slate-100 text-slate-600" },
];

function statusBadge(status: VehicleStory["launchStatus"]) {
  const opt = LAUNCH_STATUS_OPTIONS.find((o) => o.value === status);
  return opt ? (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${opt.color}`}>{opt.label}</span>
  ) : null;
}

type StoryWithDetails = VehicleStory & {
  updates: VehicleStoryUpdate[];
  media: VehicleStoryMedia[];
};

export function AdminVehicleStoriesManager({
  stories,
  models,
}: {
  stories: StoryWithDetails[];
  models: VehicleModel[];
}) {
  const router = useRouter();

  // --- Story form state ---
  const [editingStoryId, setEditingStoryId] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [brandName, setBrandName] = useState("");
  const [modelId, setModelId] = useState("");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [intro, setIntro] = useState("");
  const [body, setBody] = useState("");
  const [launchStatus, setLaunchStatus] = useState<VehicleStory["launchStatus"]>("upcoming");
  const [expectedLaunchDate, setExpectedLaunchDate] = useState("");
  const [actualLaunchDate, setActualLaunchDate] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [storyMessage, setStoryMessage] = useState("");
  const [storyError, setStoryError] = useState("");
  const [savingStory, setSavingStory] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  // --- Expanded story panel ---
  const [expandedStoryId, setExpandedStoryId] = useState("");

  // --- Update form state ---
  const [updateStoryId, setUpdateStoryId] = useState("");
  const [editingUpdateId, setEditingUpdateId] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [updateImageUrl, setUpdateImageUrl] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [savingUpdate, setSavingUpdate] = useState(false);

  // --- Media upload state ---
  const [mediaStoryId, setMediaStoryId] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaAlt, setMediaAlt] = useState("");
  const [mediaMessage, setMediaMessage] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);

  function resetStoryForm() {
    setEditingStoryId("");
    setBrandSlug("");
    setBrandName("");
    setModelId("");
    setTitle("");
    setTagline("");
    setHeroImageUrl("");
    setHeroFile(null);
    setIntro("");
    setBody("");
    setLaunchStatus("upcoming");
    setExpectedLaunchDate("");
    setActualLaunchDate("");
    setSeoTitle("");
    setSeoDescription("");
    setFeatured(false);
    setActive(true);
    setStoryMessage("");
    setStoryError("");
  }

  function beginEditStory(story: VehicleStory) {
    setEditingStoryId(story.id);
    setBrandSlug(story.brandSlug);
    setBrandName(story.brandName);
    setModelId(story.modelId ?? "");
    setTitle(story.title);
    setTagline(story.tagline ?? "");
    setHeroImageUrl(story.heroImageUrl ?? "");
    setHeroFile(null);
    setIntro(story.intro);
    setBody(story.body);
    setLaunchStatus(story.launchStatus);
    setExpectedLaunchDate(story.expectedLaunchDate ?? "");
    setActualLaunchDate(story.actualLaunchDate ?? "");
    setSeoTitle(story.seoTitle ?? "");
    setSeoDescription(story.seoDescription ?? "");
    setFeatured(story.featured);
    setActive(story.active);
    setStoryMessage("");
    setStoryError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleHeroUpload(storySlug: string) {
    if (!heroFile) return;
    setUploadingHero(true);
    setStoryError("");
    try {
      const formData = new FormData();
      formData.set("file", heroFile);
      formData.set("bucket", "vehicle-story-media");
      formData.set("prefix", storySlug || "hero");
      const res = await fetch("/api/admin/upload-to-storage", { method: "POST", body: formData });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Upload failed");
      setHeroImageUrl(payload.url);
      setHeroFile(null);
      setStoryMessage("Hero image uploaded.");
    } catch (caught) {
      setStoryError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setUploadingHero(false);
    }
  }

  async function handleStorySubmit(event: React.FormEvent) {
    event.preventDefault();
    setSavingStory(true);
    setStoryMessage("");
    setStoryError("");
    try {
      const payload = {
        brandSlug,
        brandName,
        modelId: modelId || undefined,
        title,
        tagline,
        heroImageUrl,
        intro,
        body,
        launchStatus,
        expectedLaunchDate: expectedLaunchDate || undefined,
        actualLaunchDate: actualLaunchDate || undefined,
        seoTitle,
        seoDescription,
        featured,
        active,
      };
      if (editingStoryId) {
        await patchAdminJson("/api/admin/vehicle-stories", { id: editingStoryId, ...payload });
        setStoryMessage(heroFile ? "Story updated. Don't forget to upload the hero image." : "Story updated.");
      } else {
        await postAdminJson("/api/admin/vehicle-stories", payload);
        resetStoryForm();
        setStoryMessage(heroFile ? "Story created — but the hero image was not uploaded. Edit the story to add it." : "Story created.");
      }
      router.refresh();
    } catch (caught) {
      setStoryError(caught instanceof Error ? caught.message : "Unable to save story");
    } finally {
      setSavingStory(false);
    }
  }

  async function handleDeleteStory(story: VehicleStory) {
    if (!window.confirm(`Delete story "${story.title}"? This removes all updates and media.`)) return;
    try {
      await deleteAdminJson("/api/admin/vehicle-stories", { id: story.id });
      router.refresh();
    } catch (caught) {
      setStoryError(caught instanceof Error ? caught.message : "Unable to delete story");
    }
  }

  function beginAddUpdate(storyId: string) {
    setUpdateStoryId(storyId);
    setEditingUpdateId("");
    setUpdateTitle("");
    setUpdateBody("");
    setUpdateImageUrl("");
    setUpdateMessage("");
    setUpdateError("");
  }

  function beginEditUpdate(update: VehicleStoryUpdate) {
    setUpdateStoryId(update.storyId);
    setEditingUpdateId(update.id);
    setUpdateTitle(update.title);
    setUpdateBody(update.body);
    setUpdateImageUrl(update.imageUrl ?? "");
    setUpdateMessage("");
    setUpdateError("");
  }

  function cancelUpdate() {
    setUpdateStoryId("");
    setEditingUpdateId("");
    setUpdateTitle("");
    setUpdateBody("");
    setUpdateImageUrl("");
    setUpdateMessage("");
    setUpdateError("");
  }

  async function handleUpdateSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSavingUpdate(true);
    setUpdateMessage("");
    setUpdateError("");
    try {
      const payload = {
        storyId: updateStoryId,
        title: updateTitle,
        body: updateBody,
        imageUrl: updateImageUrl || undefined,
        active: true,
      };
      if (editingUpdateId) {
        await patchAdminJson("/api/admin/vehicle-story-updates", { id: editingUpdateId, ...payload });
        setUpdateMessage("Update saved.");
      } else {
        await postAdminJson("/api/admin/vehicle-story-updates", payload);
        setUpdateMessage("Update posted.");
        cancelUpdate();
      }
      router.refresh();
    } catch (caught) {
      setUpdateError(caught instanceof Error ? caught.message : "Unable to save update");
    } finally {
      setSavingUpdate(false);
    }
  }

  async function handleDeleteUpdate(update: VehicleStoryUpdate) {
    if (!window.confirm(`Delete update "${update.title}"?`)) return;
    try {
      await deleteAdminJson("/api/admin/vehicle-story-updates", { id: update.id });
      router.refresh();
    } catch (caught) {
      setUpdateError(caught instanceof Error ? caught.message : "Unable to delete update");
    }
  }

  async function handleMediaUpload(storyId: string, storySlug: string) {
    if (!mediaFile) return;
    setUploadingMedia(true);
    setMediaMessage("");
    setMediaError("");
    try {
      const formData = new FormData();
      formData.set("file", mediaFile);
      formData.set("storyId", storyId);
      formData.set("storySlug", storySlug);
      formData.set("alt", mediaAlt || "Vehicle image");
      const res = await fetch("/api/admin/vehicle-story-media", { method: "POST", body: formData });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "Upload failed");
      setMediaFile(null);
      setMediaAlt("");
      setMediaMessage("Image uploaded.");
      router.refresh();
    } catch (caught) {
      setMediaError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleDeleteMedia(mediaId: string) {
    if (!window.confirm("Remove this image?")) return;
    try {
      await deleteAdminJson("/api/admin/vehicle-story-media", { id: mediaId });
      router.refresh();
    } catch (caught) {
      setMediaError(caught instanceof Error ? caught.message : "Unable to delete image");
    }
  }

  const activeModels = models.filter((m) => m.active);

  return (
    <div className="space-y-6">
      {/* Story form */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-emerald-700">Vehicle updates</p>
        <h1 className="mt-1 text-2xl font-black text-slate-950">
          {editingStoryId ? "Edit story" : "Create vehicle story"}
        </h1>
        <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={handleStorySubmit}>
          {/* Left column */}
          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className={adminFieldClass}
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Brand name (e.g. Maruti Suzuki)"
                required
              />
              <input
                className={adminFieldClass}
                value={brandSlug}
                onChange={(e) => setBrandSlug(e.target.value)}
                placeholder="Brand slug (e.g. maruti-suzuki)"
                required
              />
            </div>
            <input
              className={adminFieldClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Story title (e.g. Swift 2025 — Everything We Know)"
              required
            />
            <input
              className={adminFieldClass}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Tagline (short, shown on listing card)"
            />
            <textarea
              className={`${adminFieldClass} min-h-20 py-3`}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="Intro — 1-2 sentences shown on the listing card and at top of story page"
              required
            />
            <textarea
              className={`${adminFieldClass} min-h-48 py-3 font-mono text-xs`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Full story body — supports Markdown (# headings, **bold**, - lists, etc.)"
            />
          </div>

          {/* Right column */}
          <div className="grid gap-3 content-start">
            <div>
              <div className="mb-1 text-xs font-black uppercase text-slate-500">Launch status</div>
              <div className="grid grid-cols-2 gap-2">
                {LAUNCH_STATUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition ${
                      launchStatus === opt.value
                        ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="launchStatus"
                      value={opt.value}
                      checked={launchStatus === opt.value}
                      onChange={() => setLaunchStatus(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-black uppercase text-slate-500">Expected launch</div>
                <input
                  className={adminFieldClass}
                  type="date"
                  value={expectedLaunchDate}
                  onChange={(e) => setExpectedLaunchDate(e.target.value)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-black uppercase text-slate-500">Actual launch</div>
                <input
                  className={adminFieldClass}
                  type="date"
                  value={actualLaunchDate}
                  onChange={(e) => setActualLaunchDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-black uppercase text-slate-500">Link to Gaadieasy model (optional)</div>
              <select className={adminFieldClass} value={modelId} onChange={(e) => setModelId(e.target.value)}>
                <option value="">— Not linked —</option>
                {activeModels.map((m) => (
                  <option value={m.id} key={m.id}>{m.name} ({m.slug})</option>
                ))}
              </select>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-1 text-xs font-black uppercase text-slate-500">Hero image</div>
              {heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="mb-2 h-28 w-full rounded object-cover" src={heroImageUrl} alt="Hero" />
              ) : null}
              <input
                className={adminFieldClass}
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                placeholder="Hero image URL, or upload"
              />
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <input
                  className={adminFieldClass}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md bg-slate-950 px-3 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={!heroFile || uploadingHero}
                  onClick={() => handleHeroUpload(editingStoryId || "new-story")}
                >
                  <ImagePlus size={14} /> {uploadingHero ? "Uploading" : "Upload"}
                </button>
              </div>
            </div>

            <input
              className={adminFieldClass}
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="SEO title (leave blank to use story title)"
            />
            <textarea
              className={`${adminFieldClass} min-h-16 py-3`}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="SEO meta description"
            />

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Featured story
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Active / published
              </label>
            </div>

            {storyMessage ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{storyMessage}</p> : null}
            {storyError ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{storyError}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 hover:bg-lime-400 disabled:cursor-not-allowed disabled:bg-slate-200"
                disabled={savingStory}
              >
                {editingStoryId ? <Save size={16} /> : <Plus size={16} />}
                {savingStory ? "Saving…" : editingStoryId ? "Update story" : "Create story"}
              </button>
              {editingStoryId ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:border-emerald-300"
                  onClick={resetStoryForm}
                >
                  <X size={16} /> Cancel
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </section>

      {/* Stories list */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">
          Vehicle stories <span className="ml-2 text-sm font-bold text-slate-500">{stories.length} total</span>
        </h2>
        {stories.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No stories yet. Create one above.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {stories.map((story) => {
              const isExpanded = expandedStoryId === story.id;
              const linkedModel = models.find((m) => m.id === story.modelId);
              return (
                <div key={story.id}>
                  {/* Story row */}
                  <div className="grid gap-3 p-3 sm:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-950">{story.title}</span>
                        {statusBadge(story.launchStatus)}
                        {story.featured ? (
                          <span className="rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-black text-emerald-800">Featured</span>
                        ) : null}
                        {!story.active ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-500">Draft</span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-xs font-bold text-slate-500">
                        {story.brandName} · /vehicle-updates/{story.brandSlug}/{story.slug.replace(`${story.brandSlug}-`, "")}
                      </div>
                      {linkedModel ? (
                        <div className="mt-1 text-xs font-bold text-emerald-700">Linked: {linkedModel.name}</div>
                      ) : null}
                      <div className="mt-1 text-xs text-slate-500 line-clamp-1">{story.intro}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {story.updates.length} update{story.updates.length === 1 ? "" : "s"} · {story.media.length} image{story.media.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-start justify-end gap-2 text-xs font-black">
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                        onClick={() => setExpandedStoryId(isExpanded ? "" : story.id)}
                        type="button"
                      >
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {isExpanded ? "Collapse" : "Manage"}
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
                        onClick={() => beginEditStory(story)}
                        type="button"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700 hover:border-red-300"
                        onClick={() => handleDeleteStory(story)}
                        type="button"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Expanded panel — updates + media */}
                  {isExpanded ? (
                    <div className="border-t border-slate-100 bg-slate-50 p-4 grid gap-6 lg:grid-cols-2">

                      {/* Updates section */}
                      <div>
                        <h3 className="text-sm font-black text-slate-950">Updates timeline</h3>
                        <div className="mt-3 space-y-2">
                          {story.updates.map((upd) => (
                            <div key={upd.id} className="rounded-md border border-slate-200 bg-white p-3">
                              {editingUpdateId === upd.id ? (
                                <form onSubmit={handleUpdateSubmit} className="grid gap-2">
                                  <input
                                    className={adminFieldClass}
                                    value={updateTitle}
                                    onChange={(e) => setUpdateTitle(e.target.value)}
                                    placeholder="Update headline"
                                    required
                                  />
                                  <textarea
                                    className={`${adminFieldClass} min-h-20 py-3 font-mono text-xs`}
                                    value={updateBody}
                                    onChange={(e) => setUpdateBody(e.target.value)}
                                    placeholder="Update body (Markdown)"
                                  />
                                  <input
                                    className={adminFieldClass}
                                    value={updateImageUrl}
                                    onChange={(e) => setUpdateImageUrl(e.target.value)}
                                    placeholder="Image URL (optional)"
                                  />
                                  {updateMessage ? <p className="text-xs font-bold text-emerald-700">{updateMessage}</p> : null}
                                  {updateError ? <p className="text-xs font-bold text-red-700">{updateError}</p> : null}
                                  <div className="flex gap-2">
                                    <button className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950 hover:bg-lime-400" disabled={savingUpdate}>
                                      <Save size={12} /> Save
                                    </button>
                                    <button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-black text-slate-700" onClick={cancelUpdate}>
                                      <X size={12} /> Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div className="grid gap-1 sm:grid-cols-[1fr_auto]">
                                  <div>
                                    <div className="text-sm font-black text-slate-950">{upd.title}</div>
                                    <div className="text-xs text-slate-500">{new Date(upd.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                                    {upd.body ? <div className="mt-1 text-xs text-slate-600 line-clamp-2">{upd.body}</div> : null}
                                  </div>
                                  <div className="flex gap-1">
                                    <button className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:border-emerald-300 hover:text-emerald-700" onClick={() => beginEditUpdate(upd)} type="button">
                                      <Pencil size={11} />
                                    </button>
                                    <button className="rounded-full border border-red-200 p-1.5 text-red-500 hover:border-red-300" onClick={() => handleDeleteUpdate(upd)} type="button">
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Add update form */}
                        {updateStoryId === story.id && !editingUpdateId ? (
                          <form onSubmit={handleUpdateSubmit} className="mt-3 grid gap-2 rounded-md border border-emerald-200 bg-white p-3">
                            <div className="text-xs font-black uppercase text-emerald-700">Post new update</div>
                            <input
                              className={adminFieldClass}
                              value={updateTitle}
                              onChange={(e) => setUpdateTitle(e.target.value)}
                              placeholder="Update headline"
                              required
                              autoFocus
                            />
                            <textarea
                              className={`${adminFieldClass} min-h-20 py-3 font-mono text-xs`}
                              value={updateBody}
                              onChange={(e) => setUpdateBody(e.target.value)}
                              placeholder="Update body (Markdown supported)"
                            />
                            <input
                              className={adminFieldClass}
                              value={updateImageUrl}
                              onChange={(e) => setUpdateImageUrl(e.target.value)}
                              placeholder="Image URL (optional)"
                            />
                            {updateMessage ? <p className="text-xs font-bold text-emerald-700">{updateMessage}</p> : null}
                            {updateError ? <p className="text-xs font-bold text-red-700">{updateError}</p> : null}
                            <div className="flex gap-2">
                              <button className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950 hover:bg-lime-400" disabled={savingUpdate}>
                                <Plus size={12} /> Post update
                              </button>
                              <button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-black text-slate-700" onClick={cancelUpdate}>
                                <X size={12} /> Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            className="mt-3 inline-flex items-center gap-1 rounded-md border border-dashed border-emerald-300 px-3 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
                            onClick={() => beginAddUpdate(story.id)}
                          >
                            <Plus size={12} /> Add update
                          </button>
                        )}
                      </div>

                      {/* Gallery section */}
                      <div>
                        <h3 className="text-sm font-black text-slate-950">Photo gallery</h3>
                        {story.media.length > 0 ? (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {story.media.map((img) => (
                              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-md bg-slate-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img className="h-full w-full object-cover" src={img.url} alt={img.alt} />
                                <button
                                  type="button"
                                  className="absolute right-1 top-1 hidden rounded-full bg-red-600 p-1 text-white group-hover:flex"
                                  onClick={() => handleDeleteMedia(img.id)}
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">No gallery images yet.</p>
                        )}

                        <div className="mt-3 rounded-md border border-dashed border-slate-300 p-3">
                          <div className="text-xs font-black uppercase text-slate-500">Upload image</div>
                          <div className="mt-2 grid gap-2">
                            <input
                              className={adminFieldClass}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(e) => {
                                setMediaStoryId(story.id);
                                setMediaFile(e.target.files?.[0] ?? null);
                              }}
                            />
                            <input
                              className={adminFieldClass}
                              value={mediaStoryId === story.id ? mediaAlt : ""}
                              onChange={(e) => { setMediaStoryId(story.id); setMediaAlt(e.target.value); }}
                              placeholder="Alt text for this image"
                            />
                            {mediaMessage && mediaStoryId === story.id ? <p className="text-xs font-bold text-emerald-700">{mediaMessage}</p> : null}
                            {mediaError && mediaStoryId === story.id ? <p className="text-xs font-bold text-red-700">{mediaError}</p> : null}
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                              disabled={!mediaFile || mediaStoryId !== story.id || uploadingMedia}
                              onClick={() => handleMediaUpload(story.id, story.slug)}
                            >
                              <ImagePlus size={12} /> {uploadingMedia && mediaStoryId === story.id ? "Uploading…" : "Upload image"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

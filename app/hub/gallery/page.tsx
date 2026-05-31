"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  ImagePlus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminGate } from "@/components/hub/AdminGate";
import { getPrograms } from "@/lib/programs";
import type { GalleryAlbumRecord, GalleryPhotoRecord, ProgramSlug } from "@/lib/gallery/types";

interface AlbumFormState {
  title: string;
  eventDate: string;
  location: string;
  description: string;
  coverImageUrl: string;
  isPublic: boolean;
}

interface PhotoFormState {
  title: string;
  description: string;
  takenAt: string;
  sortOrder: number;
  isPublic: boolean;
}

const programs = getPrograms().map((program) => ({
  slug: program.slug as ProgramSlug,
  title: program.title,
}));

const initialAlbumForm: AlbumFormState = {
  title: "",
  eventDate: "",
  location: "",
  description: "",
  coverImageUrl: "",
  isPublic: false,
};

const initialPhotoForm: PhotoFormState = {
  title: "",
  description: "",
  takenAt: "",
  sortOrder: 0,
  isPublic: true,
};

function formatDate(value: string | null) {
  if (!value) {
    return "날짜 미정";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(parsed);
}

function HubGalleryContent({ adminPassword }: { adminPassword: string }) {
  const router = useRouter();
  const [selectedProgramSlug, setSelectedProgramSlug] = useState<ProgramSlug>(programs[0].slug);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>("");

  const [albums, setAlbums] = useState<GalleryAlbumRecord[]>([]);
  const [photos, setPhotos] = useState<GalleryPhotoRecord[]>([]);
  const [albumDrafts, setAlbumDrafts] = useState<Record<string, AlbumFormState>>({});
  const [photoDrafts, setPhotoDrafts] = useState<Record<string, PhotoFormState>>({});

  const [albumForm, setAlbumForm] = useState<AlbumFormState>(initialAlbumForm);
  const [photoForm, setPhotoForm] = useState<PhotoFormState>(initialPhotoForm);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const [isLoadingAlbums, setIsLoadingAlbums] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedAlbum = useMemo(
    () => albums.find((album) => album.id === selectedAlbumId) ?? null,
    [albums, selectedAlbumId],
  );

  const authorizedFetch = async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers ?? {});
    headers.set("x-admin-password", adminPassword);
    return fetch(url, {
      ...init,
      headers,
      cache: "no-store",
    });
  };

  const loadAlbums = async () => {
    setIsLoadingAlbums(true);
    setErrorMessage("");
    try {
      const response = await authorizedFetch(
        `/api/hub/gallery/albums?programSlug=${selectedProgramSlug}`,
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        items?: GalleryAlbumRecord[];
      };

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "앨범 목록을 불러오지 못했습니다.");
        return;
      }

      const loadedAlbums = payload.items ?? [];
      setAlbums(loadedAlbums);
      setAlbumDrafts(
        Object.fromEntries(
          loadedAlbums.map((album) => [
            album.id,
            {
              title: album.title,
              eventDate: album.eventDate ?? "",
              location: album.location ?? "",
              description: album.description ?? "",
              coverImageUrl: album.coverImageUrl ?? "",
              isPublic: album.isPublic,
            },
          ]),
        ),
      );

      if (loadedAlbums.length > 0) {
        setSelectedAlbumId((prev) =>
          prev && loadedAlbums.some((album) => album.id === prev) ? prev : loadedAlbums[0].id,
        );
      } else {
        setSelectedAlbumId("");
      }
    } catch {
      setErrorMessage("앨범 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingAlbums(false);
    }
  };

  const loadPhotos = async (albumId: string) => {
    if (!albumId) {
      setPhotos([]);
      return;
    }

    setIsLoadingPhotos(true);
    setErrorMessage("");
    try {
      const response = await authorizedFetch(`/api/hub/gallery/photos?albumId=${albumId}`);
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        items?: GalleryPhotoRecord[];
      };

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "사진 목록을 불러오지 못했습니다.");
        return;
      }

      const loadedPhotos = payload.items ?? [];
      setPhotos(loadedPhotos);
      setPhotoDrafts(
        Object.fromEntries(
          loadedPhotos.map((photo) => [
            photo.id,
            {
              title: photo.title ?? "",
              description: photo.description ?? "",
              takenAt: photo.takenAt ?? "",
              sortOrder: photo.sortOrder,
              isPublic: photo.isPublic,
            },
          ]),
        ),
      );
    } catch {
      setErrorMessage("사진 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  useEffect(() => {
    void loadAlbums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgramSlug, adminPassword]);

  useEffect(() => {
    void loadPhotos(selectedAlbumId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlbumId, adminPassword]);

  const refreshAll = async () => {
    await loadAlbums();
    if (selectedAlbumId) {
      await loadPhotos(selectedAlbumId);
    }
    router.refresh();
  };

  const handleCreateAlbum = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!albumForm.title.trim()) {
      setErrorMessage("앨범 제목은 필수입니다.");
      return;
    }

    setIsCreatingAlbum(true);
    try {
      const response = await authorizedFetch("/api/hub/gallery/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: albumForm.title,
          programSlug: selectedProgramSlug,
          eventDate: albumForm.eventDate || null,
          location: albumForm.location || null,
          description: albumForm.description || null,
          coverImageUrl: albumForm.coverImageUrl || null,
          isPublic: albumForm.isPublic,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        id?: string;
      };

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "앨범 생성에 실패했습니다.");
        return;
      }

      setMessage(payload.message ?? "앨범이 생성되었습니다.");
      setAlbumForm(initialAlbumForm);
      await loadAlbums();
      if (payload.id) {
        setSelectedAlbumId(payload.id);
      }
      router.refresh();
    } catch {
      setErrorMessage("앨범 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const saveAlbum = async (albumId: string) => {
    const draft = albumDrafts[albumId];
    if (!draft) {
      return;
    }
    setMessage("");
    setErrorMessage("");
    try {
      const response = await authorizedFetch(`/api/hub/gallery/albums/${albumId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          programSlug: selectedProgramSlug,
          eventDate: draft.eventDate || null,
          location: draft.location || null,
          description: draft.description || null,
          coverImageUrl: draft.coverImageUrl || null,
          isPublic: draft.isPublic,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "앨범 수정에 실패했습니다.");
        return;
      }

      setMessage(payload.message ?? "앨범이 수정되었습니다.");
      await refreshAll();
    } catch {
      setErrorMessage("앨범 수정 중 오류가 발생했습니다.");
    }
  };

  const deleteAlbum = async (albumId: string) => {
    const confirmed = window.confirm("선택한 앨범과 연결된 사진을 모두 삭제하시겠습니까?");
    if (!confirmed) {
      return;
    }

    setMessage("");
    setErrorMessage("");
    try {
      const response = await authorizedFetch(`/api/hub/gallery/albums/${albumId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "앨범 삭제에 실패했습니다.");
        return;
      }

      setMessage(payload.message ?? "앨범이 삭제되었습니다.");
      await refreshAll();
    } catch {
      setErrorMessage("앨범 삭제 중 오류가 발생했습니다.");
    }
  };

  const uploadAndCreatePhoto = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!selectedAlbumId) {
      setErrorMessage("먼저 앨범을 선택해 주세요.");
      return;
    }
    if (!uploadFile) {
      setErrorMessage("업로드할 사진 파일을 선택해 주세요.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", uploadFile);
      uploadData.append("programSlug", selectedProgramSlug);
      uploadData.append("albumId", selectedAlbumId);

      const uploadResponse = await authorizedFetch("/api/hub/gallery/upload", {
        method: "POST",
        body: uploadData,
      });

      const uploadPayload = (await uploadResponse.json()) as {
        ok?: boolean;
        message?: string;
        publicUrl?: string;
      };

      if (!uploadResponse.ok || !uploadPayload.ok || !uploadPayload.publicUrl) {
        setErrorMessage(uploadPayload.message ?? "이미지 업로드에 실패했습니다.");
        return;
      }

      const photoResponse = await authorizedFetch("/api/hub/gallery/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          albumId: selectedAlbumId,
          programSlug: selectedProgramSlug,
          imageUrl: uploadPayload.publicUrl,
          title: photoForm.title || null,
          description: photoForm.description || null,
          takenAt: photoForm.takenAt || null,
          sortOrder: photoForm.sortOrder,
          isPublic: photoForm.isPublic,
        }),
      });

      const photoPayload = (await photoResponse.json()) as { ok?: boolean; message?: string };
      if (!photoResponse.ok || !photoPayload.ok) {
        setErrorMessage(photoPayload.message ?? "사진 저장에 실패했습니다.");
        return;
      }

      setMessage("사진 업로드 및 등록이 완료되었습니다.");
      setUploadFile(null);
      setPhotoForm(initialPhotoForm);
      await refreshAll();
    } catch {
      setErrorMessage("사진 업로드 처리 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const savePhoto = async (photoId: string) => {
    const draft = photoDrafts[photoId];
    if (!draft) {
      return;
    }
    setMessage("");
    setErrorMessage("");

    try {
      const response = await authorizedFetch(`/api/hub/gallery/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title || null,
          description: draft.description || null,
          takenAt: draft.takenAt || null,
          sortOrder: draft.sortOrder,
          isPublic: draft.isPublic,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "사진 수정에 실패했습니다.");
        return;
      }

      setMessage(payload.message ?? "사진 정보가 수정되었습니다.");
      await refreshAll();
    } catch {
      setErrorMessage("사진 수정 중 오류가 발생했습니다.");
    }
  };

  const deletePhoto = async (photoId: string) => {
    const confirmed = window.confirm("이 사진을 삭제하시겠습니까?");
    if (!confirmed) {
      return;
    }
    setMessage("");
    setErrorMessage("");
    try {
      const response = await authorizedFetch(`/api/hub/gallery/photos/${photoId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.message ?? "사진 삭제에 실패했습니다.");
        return;
      }
      setMessage(payload.message ?? "사진이 삭제되었습니다.");
      await refreshAll();
    } catch {
      setErrorMessage("사진 삭제 중 오류가 발생했습니다.");
    }
  };

  const setCoverFromPhoto = async (photo: GalleryPhotoRecord) => {
    if (!selectedAlbumId) {
      return;
    }
    const draft = albumDrafts[selectedAlbumId];
    if (!draft) {
      return;
    }
    setAlbumDrafts((prev) => ({
      ...prev,
      [selectedAlbumId]: {
        ...draft,
        coverImageUrl: photo.imageUrl,
      },
    }));
    await saveAlbum(selectedAlbumId);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft md:p-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          Gallery Admin
        </p>
        <h1 className="mt-2 font-heading text-3xl font-black text-brand-primary">갤러리 관리</h1>
        <p className="mt-2 text-sm text-foreground/80">
          1) 앨범 생성 2) 사진 업로드 3) 공개 전환 순서로 운영하세요.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/hub/notion"
            className="rounded-lg border border-brand-primary/20 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            Notion 동기화 관리
          </Link>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 bg-white px-3 py-1.5 text-sm font-semibold text-brand-primary hover:bg-brand-cream"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            새로고침
          </button>
        </div>
      </header>

      {errorMessage ? (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {errorMessage}
        </p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {message}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft lg:col-span-4">
          <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-brand-primary">
            <FolderPlus className="h-5 w-5" aria-hidden />
            앨범 만들기
          </h2>
          <label className="mt-4 block text-sm font-semibold text-foreground/90">
            프로그램 선택
            <select
              value={selectedProgramSlug}
              onChange={(event) => setSelectedProgramSlug(event.target.value as ProgramSlug)}
              className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
            >
              {programs.map((program) => (
                <option key={program.slug} value={program.slug}>
                  {program.title}
                </option>
              ))}
            </select>
          </label>

          <form onSubmit={handleCreateAlbum} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-foreground/90">
              앨범 제목 *
              <input
                value={albumForm.title}
                onChange={(event) =>
                  setAlbumForm((prev) => ({ ...prev, title: event.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              행사 날짜
              <input
                type="date"
                value={albumForm.eventDate}
                onChange={(event) =>
                  setAlbumForm((prev) => ({ ...prev, eventDate: event.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              장소
              <input
                value={albumForm.location}
                onChange={(event) =>
                  setAlbumForm((prev) => ({ ...prev, location: event.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              설명
              <textarea
                value={albumForm.description}
                onChange={(event) =>
                  setAlbumForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className="mt-1.5 min-h-20 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm outline-none ring-brand-secondary focus:ring-2"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <input
                type="checkbox"
                checked={albumForm.isPublic}
                onChange={(event) =>
                  setAlbumForm((prev) => ({ ...prev, isPublic: event.target.checked }))
                }
              />
              생성 즉시 공개
            </label>
            <button
              type="submit"
              disabled={isCreatingAlbum}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
            >
              <FolderPlus className="h-4 w-4" aria-hidden />
              {isCreatingAlbum ? "생성 중..." : "앨범 생성"}
            </button>
          </form>
        </article>

        <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft lg:col-span-8">
          <h2 className="text-lg font-extrabold text-brand-primary">앨범 목록</h2>
          {isLoadingAlbums ? (
            <p className="mt-4 text-sm text-foreground/75">앨범 목록을 불러오는 중...</p>
          ) : albums.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-cream p-4 text-sm text-foreground/80">
              등록된 앨범이 없습니다.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {albums.map((album) => {
                const draft = albumDrafts[album.id];
                if (!draft) return null;
                const isSelected = selectedAlbumId === album.id;
                return (
                  <article
                    key={album.id}
                    className={`rounded-2xl border p-4 ${
                      isSelected
                        ? "border-brand-primary bg-brand-cream/70"
                        : "border-brand-primary/10 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button type="button" onClick={() => setSelectedAlbumId(album.id)} className="text-left">
                        <h3 className="text-base font-bold text-brand-primary">{album.title}</h3>
                        <p className="text-xs text-foreground/70">
                          {formatDate(album.eventDate)} | 사진 {album.photoCount}장
                        </p>
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void saveAlbum(album.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 px-2.5 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-cream"
                        >
                          <Save className="h-3.5 w-3.5" aria-hidden />
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteAlbum(album.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-foreground/80">
                        제목
                        <input
                          value={draft.title}
                          onChange={(event) =>
                            setAlbumDrafts((prev) => ({
                              ...prev,
                              [album.id]: { ...draft, title: event.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-foreground/80">
                        행사 날짜
                        <input
                          type="date"
                          value={draft.eventDate}
                          onChange={(event) =>
                            setAlbumDrafts((prev) => ({
                              ...prev,
                              [album.id]: { ...draft, eventDate: event.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-foreground/80">
                        장소
                        <input
                          value={draft.location}
                          onChange={(event) =>
                            setAlbumDrafts((prev) => ({
                              ...prev,
                              [album.id]: { ...draft, location: event.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-foreground/80">
                        대표 이미지 URL
                        <input
                          value={draft.coverImageUrl}
                          onChange={(event) =>
                            setAlbumDrafts((prev) => ({
                              ...prev,
                              [album.id]: { ...draft, coverImageUrl: event.target.value },
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                        />
                      </label>
                    </div>
                    <label className="mt-2 block text-xs font-semibold text-foreground/80">
                      설명
                      <textarea
                        value={draft.description}
                        onChange={(event) =>
                          setAlbumDrafts((prev) => ({
                            ...prev,
                            [album.id]: { ...draft, description: event.target.value },
                          }))
                        }
                        className="mt-1 min-h-20 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                      />
                    </label>
                    <label className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-foreground/80">
                      <input
                        type="checkbox"
                        checked={draft.isPublic}
                        onChange={(event) =>
                          setAlbumDrafts((prev) => ({
                            ...prev,
                            [album.id]: { ...draft, isPublic: event.target.checked },
                          }))
                        }
                      />
                      공개 앨범으로 노출
                    </label>
                  </article>
                );
              })}
            </div>
          )}
        </article>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft lg:col-span-4">
          <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-brand-primary">
            <ImagePlus className="h-5 w-5" aria-hidden />
            사진 올리기
          </h2>
          <p className="mt-2 text-xs text-foreground/75">
            업로드 경로: gallery/{selectedProgramSlug}/{selectedAlbumId || "{albumId}"}/file
          </p>
          <form onSubmit={uploadAndCreatePhoto} className="mt-4 space-y-3">
            <label className="block text-sm font-semibold text-foreground/90">
              업로드 파일 *
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              사진 제목
              <input
                value={photoForm.title}
                onChange={(event) => setPhotoForm((prev) => ({ ...prev, title: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              설명
              <textarea
                value={photoForm.description}
                onChange={(event) =>
                  setPhotoForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className="mt-1.5 min-h-20 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              촬영일
              <input
                type="date"
                value={photoForm.takenAt}
                onChange={(event) => setPhotoForm((prev) => ({ ...prev, takenAt: event.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold text-foreground/90">
              정렬 순서
              <input
                type="number"
                value={photoForm.sortOrder}
                onChange={(event) =>
                  setPhotoForm((prev) => ({
                    ...prev,
                    sortOrder: Number.parseInt(event.target.value, 10) || 0,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-brand-primary/15 px-3 py-2.5 text-sm"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <input
                type="checkbox"
                checked={photoForm.isPublic}
                onChange={(event) =>
                  setPhotoForm((prev) => ({ ...prev, isPublic: event.target.checked }))
                }
              />
              공개 사진으로 노출
            </label>
            <button
              type="submit"
              disabled={isUploadingPhoto}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:bg-brand-primary/50"
            >
              <Upload className="h-4 w-4" aria-hidden />
              {isUploadingPhoto ? "업로드 중..." : "사진 업로드"}
            </button>
          </form>
        </article>

        <article className="rounded-3xl border border-brand-primary/12 bg-white p-5 shadow-soft lg:col-span-8">
          <h2 className="text-lg font-extrabold text-brand-primary">사진 목록</h2>
          {!selectedAlbum ? (
            <p className="mt-4 text-sm text-foreground/75">먼저 앨범을 선택해 주세요.</p>
          ) : isLoadingPhotos ? (
            <p className="mt-4 text-sm text-foreground/75">사진 목록을 불러오는 중...</p>
          ) : photos.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-brand-primary/20 bg-brand-cream p-4 text-sm text-foreground/80">
              업로드된 사진이 없습니다.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {photos.map((photo) => {
                const draft = photoDrafts[photo.id];
                if (!draft) return null;
                return (
                  <article key={photo.id} className="rounded-2xl border border-brand-primary/10 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
                      <div className="overflow-hidden rounded-xl border border-brand-primary/10 bg-brand-cream">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.imageUrl}
                          alt={photo.title || "갤러리 사진"}
                          className="aspect-[4/3] h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <label className="text-xs font-semibold text-foreground/80">
                            제목
                            <input
                              value={draft.title}
                              onChange={(event) =>
                                setPhotoDrafts((prev) => ({
                                  ...prev,
                                  [photo.id]: { ...draft, title: event.target.value },
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                            />
                          </label>
                          <label className="text-xs font-semibold text-foreground/80">
                            촬영일
                            <input
                              type="date"
                              value={draft.takenAt}
                              onChange={(event) =>
                                setPhotoDrafts((prev) => ({
                                  ...prev,
                                  [photo.id]: { ...draft, takenAt: event.target.value },
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                            />
                          </label>
                          <label className="text-xs font-semibold text-foreground/80">
                            정렬 순서
                            <input
                              type="number"
                              value={draft.sortOrder}
                              onChange={(event) =>
                                setPhotoDrafts((prev) => ({
                                  ...prev,
                                  [photo.id]: {
                                    ...draft,
                                    sortOrder: Number.parseInt(event.target.value, 10) || 0,
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                            />
                          </label>
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/80">
                            <input
                              type="checkbox"
                              checked={draft.isPublic}
                              onChange={(event) =>
                                setPhotoDrafts((prev) => ({
                                  ...prev,
                                  [photo.id]: { ...draft, isPublic: event.target.checked },
                                }))
                              }
                            />
                            공개
                          </label>
                        </div>
                        <label className="mt-2 block text-xs font-semibold text-foreground/80">
                          설명
                          <textarea
                            value={draft.description}
                            onChange={(event) =>
                              setPhotoDrafts((prev) => ({
                                ...prev,
                                [photo.id]: { ...draft, description: event.target.value },
                              }))
                            }
                            className="mt-1 min-h-20 w-full rounded-lg border border-brand-primary/15 px-2.5 py-2 text-sm"
                          />
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void savePhoto(photo.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-cream"
                          >
                            <Save className="h-3.5 w-3.5" aria-hidden />
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => void deletePhoto(photo.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            삭제
                          </button>
                          <button
                            type="button"
                            onClick={() => void setCoverFromPhoto(photo)}
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-primary/20 px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-cream"
                          >
                            대표 이미지로 설정
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default function HubGalleryPage() {
  return (
    <AdminGate
      title="갤러리 관리"
      description="앨범 만들기 → 사진 올리기 → 공개하기 순서로 관리할 수 있습니다."
    >
      {({ adminPassword }) => <HubGalleryContent adminPassword={adminPassword} />}
    </AdminGate>
  );
}

import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { SectionTitle } from "@/components/common/section-title";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

import { getAnnouncements } from "../services/announcement.service";
import type { Announcement } from "../types/announcement.types";

export async function AnnouncementSection({
  limit,
  withHeader = true,
}: {
  limit?: number;
  withHeader?: boolean;
}) {
  let items: Announcement[] = [];

  try {
    items = await getAnnouncements();
  } catch {
    items = [];
  }

  const visible = limit ? items.slice(0, limit) : items;

  return (
    <div>
      {withHeader ? (
        <SectionTitle
          title="Pengumuman"
          subtitle="Informasi penting bagi jemaat."
        />
      ) : null}

      {visible.length > 0 ? (
        <div className="space-y-3">
          {visible.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex gap-3">
                <Megaphone
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.publishedAt)}
                  </p>
                  <h3 className="font-medium">{item.title}</h3>
                  {item.body ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.body}
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada pengumuman"
          description="Pengumuman akan tampil di sini setelah dipublikasikan."
        />
      )}
    </div>
  );
}

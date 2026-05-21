-- 描述：为 History、Activities、Clubs 加多媒体字段
-- 日期：2026-05-21
-- 影响表：uco_history, uco_activities, uco_clubs
-- Captain K 批准：v2.0 铁律四

-- ═══════════════════════════════
-- UP（执行）
-- ═══════════════════════════════

-- uco_history: 加 video_links, cover_photo（photos 已存在）
ALTER TABLE uco_history
  ADD COLUMN IF NOT EXISTS video_links  text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cover_photo  text;

-- uco_activities: 加 event media 字段
ALTER TABLE uco_activities
  ADD COLUMN IF NOT EXISTS event_photos      text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS event_video_links text[] DEFAULT '{}';

-- uco_clubs: 加 gallery_photos（cover_image_url 和 logo_url 已存在）
ALTER TABLE uco_clubs
  ADD COLUMN IF NOT EXISTS gallery_photos text[] DEFAULT '{}';

-- ═══════════════════════════════
-- DOWN（撤销，如需回滚运行这段）
-- ═══════════════════════════════
-- ALTER TABLE uco_history      DROP COLUMN IF EXISTS video_links;
-- ALTER TABLE uco_history      DROP COLUMN IF EXISTS cover_photo;
-- ALTER TABLE uco_activities   DROP COLUMN IF EXISTS event_photos;
-- ALTER TABLE uco_activities   DROP COLUMN IF EXISTS event_video_links;
-- ALTER TABLE uco_clubs        DROP COLUMN IF EXISTS gallery_photos;

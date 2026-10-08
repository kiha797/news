type AdSpaceProps = { placement: 'top' | 'bottom' };

/** Reserved mount points for the owner's AdSense units. No ad requests are
 * made until the real publisher and slot IDs are supplied and integrated. */
export function AdSpace({ placement }: AdSpaceProps) {
  return (
    <aside className={`ad-space ad-space-${placement}`} aria-label="광고 영역" data-ad-placement={placement}>
      <span className="ad-space-label">광고</span>
      <div className="ad-space-container" id={`adsense-${placement}`}>
        <span className="ad-space-placeholder">광고 준비 중</span>
      </div>
    </aside>
  );
}

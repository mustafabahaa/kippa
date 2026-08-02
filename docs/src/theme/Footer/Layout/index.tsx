import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import type { Props } from '@theme/Footer/Layout';

export default function FooterLayout({
  style,
  links,
  logo,
  copyright,
}: Props): ReactNode {
  return (
    <footer
      className={clsx(ThemeClassNames.layout.footer.container, 'footer', {
        'footer--dark': style === 'dark',
      })}
    >
      <div className="container container-fluid kippa-footer-layout">
        {links}
        {(logo || copyright) && (
          <div className="footer__bottom kippa-footer-bottom">
            {logo && <div className="kippa-footer-mark">{logo}</div>}
            {copyright}
          </div>
        )}
      </div>
    </footer>
  );
}

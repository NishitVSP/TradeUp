'use client';

import { Panel, PanelHeader, PanelTitle, PlaceholderText } from './styled';

export function Terminal() {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Terminal</PanelTitle>
      </PanelHeader>
      <PlaceholderText>
        Trading terminal will be displayed here
      </PlaceholderText>
    </Panel>
  );
}
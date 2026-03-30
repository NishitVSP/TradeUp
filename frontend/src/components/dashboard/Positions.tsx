'use client';

import { Panel, PanelHeader, PanelTitle, PlaceholderText } from './styled';

export function Positions() {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Positions</PanelTitle>
      </PanelHeader>
      <PlaceholderText>
        Your active positions will appear here
      </PlaceholderText>
    </Panel>
  );
}
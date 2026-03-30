'use client';

import { Panel, PanelHeader, PanelTitle, PlaceholderText } from './styled';

export function OptionSelector() {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Option Contracts</PanelTitle>
      </PanelHeader>
      <PlaceholderText>
        Select options contracts to trade
      </PlaceholderText>
    </Panel>
  );
}
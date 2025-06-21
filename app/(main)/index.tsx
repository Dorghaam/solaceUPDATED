import React from 'react';
import { MainFeedScreen } from '../../components/MainFeedScreen';

// This screen now acts as a simple wrapper that renders our main UI component.
// All the UI logic is contained within MainFeedScreen.
export default function FeedPage() {
  return <MainFeedScreen />;
} 
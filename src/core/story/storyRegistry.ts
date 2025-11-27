import {StoryTrigger} from './storyTrigger';
import {AuronDriftTrigger} from './triggers/auronDriftTrigger';

export const defaultStoryTriggers: StoryTrigger[] = [
  new AuronDriftTrigger(),
];

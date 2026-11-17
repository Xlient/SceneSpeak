import { installToSorted } from "./array-to-sorted";
import { installIntlDisplayNames } from "./intl-display-names";

installIntlDisplayNames(Intl);
installToSorted(Array.prototype);

C:\Users\milto\Documents\ai-saas>npm run lint

> ai-saas@0.1.0 lint
> eslint


C:\Users\milto\Documents\ai-saas\authStore.ts
   63:7   warning  'ONE_DAY_MS' is assigned a value but never used  @typescript-eslint/no-unused-vars
  204:33  error    Unexpected any. Specify a different type         @typescript-eslint/no-explicit-any

C:\Users\milto\Documents\ai-saas\scripts\create-indexes.ts
  63:16  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\app\api\workspace\dashboards\[dashboardId]\route.ts
  36:13  warning  'updated' is assigned a value but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\components\onboarding\steps\ConfirmationStep.tsx
  6:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\milto\Documents\ai-saas\src\components\onboarding\steps\PreferencesStep.tsx
  5:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  7:48  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\milto\Documents\ai-saas\src\components\ui\UpgradeModal.tsx
  25:3  warning  'stripeCheckoutUrl' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\containers\admin\AdminContainer.tsx
   19:10  warning  'UpgradeModal' is defined but never used                                                                               @typescript-eslint/no-unused-vars
   20:10  warning  'PaymentEmailModal' is defined but never used                                                                          @typescript-eslint/no-unused-vars
   38:3   warning  'useModalState' is defined but never used                                                                              @typescript-eslint/no-unused-vars
   71:11  warning  'setBaseColor' is assigned a value but never used                                                                      @typescript-eslint/no-unused-vars
   82:5   warning  'closeBulkUpload' is assigned a value but never used                                                                   @typescript-eslint/no-unused-vars
   88:9   warning  'isUpdatingDashboardRef' is assigned a value but never used                                                            @typescript-eslint/no-unused-vars
  208:6   warning  React Hook useCallback has a missing dependency: 'workspaceActions'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  249:6   warning  React Hook useCallback has a missing dependency: 'workspaceActions'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  310:9   warning  'allNotes' is assigned a value but never used                                                                          @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\containers\home\HomeContainer.tsx
  18:5  warning  'canPerformAction' is assigned a value but never used  @typescript-eslint/no-unused-vars
  21:5  warning  'startCheckout' is assigned a value but never used     @typescript-eslint/no-unused-vars
  24:5  warning  'limits' is assigned a value but never used            @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\ai\tile-generation.ts
  195:26  warning  'templateId' is assigned a value but never used      @typescript-eslint/no-unused-vars
  195:38  warning  'templateTileId' is assigned a value but never used  @typescript-eslint/no-unused-vars
  195:54  warning  'category' is assigned a value but never used        @typescript-eslint/no-unused-vars
  195:71  warning  'orderIndex' is assigned a value but never used      @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\audit\logger.ts
   90:16  warning  'error' is defined but never used                @typescript-eslint/no-unused-vars
  137:14  warning  'dbError' is defined but never used              @typescript-eslint/no-unused-vars
  210:15  warning  '_userId' is assigned a value but never used     @typescript-eslint/no-unused-vars
  210:24  warning  '_eventType' is assigned a value but never used  @typescript-eslint/no-unused-vars
  210:36  warning  '_timestamp' is assigned a value but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\auth\authorize.ts
  201:11  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

C:\Users\milto\Documents\ai-saas\src\lib\color.ts
  35:9  warning  'adjustment' is assigned a value but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\contexts\AuthContext.tsx
  131:18  warning  'setStatus' is assigned a value but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\contexts\ContentContext.tsx
  12:15  warning  'Dashboard' is defined but never used               @typescript-eslint/no-unused-vars
  16:29  warning  'updateDashboardInStore' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\contexts\WorkspaceContext.tsx
  17:3  warning  'getWorkspaceById' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\db\indexes.ts
  15:27  warning  'IndexSpecification' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\db\models\Workspace.ts
  6:3  warning  'Tile' is defined but never used     @typescript-eslint/no-unused-vars
  7:3  warning  'Note' is defined but never used     @typescript-eslint/no-unused-vars
  8:3  warning  'Contact' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\middleware\rate-limit.ts
   53:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars
  246:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\state\payment-context.tsx
  69:16  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\state\query\client.ts
  42:33  warning  'variables' is defined but never used  @typescript-eslint/no-unused-vars
  42:53  warning  'context' is defined but never used    @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\state\query\contact.queries.ts
    1:10  warning  'useQuery' is defined but never used   @typescript-eslint/no-unused-vars
  126:17  warning  '_' is defined but never used          @typescript-eslint/no-unused-vars
  126:20  warning  'contactId' is defined but never used  @typescript-eslint/no-unused-vars
  159:17  warning  'data' is defined but never used       @typescript-eslint/no-unused-vars
  159:25  warning  'contactId' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\state\query\dashboard.queries.ts
  61:17  warning  'data' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\state\query\note.queries.ts
    1:10  warning  'useQuery' is defined but never used  @typescript-eslint/no-unused-vars
  114:17  warning  '_' is defined but never used         @typescript-eslint/no-unused-vars
  114:20  warning  'noteId' is defined but never used    @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\storage\dashboards-store.ts
  2:34  warning  'Tile' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\stores\authStore.ts
  63:7  warning  'ONE_DAY_MS' is assigned a value but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\stores\contentHooks.ts
    3:24  warning  'Note' is defined but never used       @typescript-eslint/no-unused-vars
  117:22  warning  'tileId' is defined but never used     @typescript-eslint/no-unused-vars
  117:38  warning  'updates' is defined but never used    @typescript-eslint/no-unused-vars
  211:29  warning  'contactId' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\lib\stores\uiStore.ts
  44:11  warning  'get' is defined but never used  @typescript-eslint/no-unused-vars

C:\Users\milto\Documents\ai-saas\src\middleware.ts
  33:18  warning  'auditError' is defined but never used  @typescript-eslint/no-unused-vars

✖ 61 problems (5 errors, 56 warnings)

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetUpdateModule, NSObject)

RCT_EXTERN_METHOD(updateQuotes:(NSArray<NSDictionary *> *)quotesData)
RCT_EXTERN_METHOD(updateUserName:(NSString *)userName)

@end 
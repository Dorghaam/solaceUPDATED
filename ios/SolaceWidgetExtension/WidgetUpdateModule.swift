// File: ios/WidgetUpdateModule.swift
import Foundation
import WidgetKit

@objc(WidgetUpdateModule)
class WidgetUpdateModule: NSObject {
    @objc
    func updateQuotes(_ quotes: [String]) {
        guard let dataManager = SharedDataManager.shared else {
            print("❌ WIDGET BRIDGE: Failed to initialize SharedDataManager.")
            return
        }

        // Save quotes to shared container
        dataManager.saveQuotes(quotes)

        // Reload widget timelines from the main app thread
        DispatchQueue.main.async {
            // The kind should match the `kind` string in your widget's configuration
            WidgetCenter.shared.reloadTimelines(ofKind: "SolaceWidget")
            print("🔄 WIDGET BRIDGE: Widget timeline reloaded from host app.")
        }
    }
    
    @objc
    func updateUserName(_ userName: String) {
        guard let dataManager = SharedDataManager.shared else {
            print("❌ WIDGET BRIDGE: Failed to initialize SharedDataManager for user name update.")
            return
        }
        
        // Save user name to shared container
        dataManager.saveUserName(userName)
        
        // Reload widget timelines to update with new user name
        DispatchQueue.main.async {
            WidgetCenter.shared.reloadTimelines(ofKind: "SolaceWidget")
            print("🔄 WIDGET BRIDGE: Widget timeline reloaded with new user name.")
        }
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
} 
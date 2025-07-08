// File: ios/WidgetUpdateModule.swift
import Foundation
import WidgetKit

@objc(WidgetUpdateModule)
class WidgetUpdateModule: NSObject {
    @objc
    func updateQuotes(_ quotesData: [[String: Any]]) {
        print("🔄 WIDGET BRIDGE: Received \(quotesData.count) quotes from JavaScript")
        print("🔄 WIDGET BRIDGE: Raw data: \(quotesData)")
        
        guard let dataManager = SharedDataManager.shared else {
            print("❌ WIDGET BRIDGE: Failed to initialize SharedDataManager.")
            return
        }

        // Convert the array of dictionaries to WidgetQuote objects
        let quotes: [SharedDataManager.WidgetQuote] = quotesData.compactMap { dict in
            print("🔄 WIDGET BRIDGE: Processing dict: \(dict)")
            guard let id = dict["id"] as? String,
                  let text = dict["text"] as? String else {
                print("❌ WIDGET BRIDGE: Invalid quote data format: \(dict)")
                print("❌ WIDGET BRIDGE: id type: \(type(of: dict["id"])), text type: \(type(of: dict["text"]))")
                return nil
            }
            print("✅ WIDGET BRIDGE: Successfully converted quote - id: \(id), text: \(text.prefix(50))...")
            return SharedDataManager.WidgetQuote(id: id, text: text)
        }

        print("🔄 WIDGET BRIDGE: Converting \(quotesData.count) quotes to \(quotes.count) WidgetQuote objects")

        // Save quotes to shared container
        dataManager.saveQuotes(quotes)

        // Test: Load back the quotes to verify they were saved
        let savedQuotes = dataManager.loadQuotes()
        print("🔍 WIDGET BRIDGE: Verification - loaded \(savedQuotes.count) quotes after saving")

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
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Crypto.Encodings;
using Org.BouncyCastle.Crypto.Engines;
using Org.BouncyCastle.Security;
using System;
using System.Collections.Generic;
using System.Text;

namespace Zlsoft.AppSSO.Utility
{
    /// <summary>
    /// 中联统一身份认证对接帮助类
    /// 更新：2023-09-18 15:40  fj  原始版本
    /// 更新：2023-10-20 14:49  fj  IintOnStartup 的警告日志文字优化并从Error改为Warn：
    /// 更新：2023-10-25 14:06  fj  IsEnable 的判断改为动态，以应对运行过程中停用统一身份认证数据源的情况：
    /// 更新：2024-10-28 cwsheng IsEnablePasswordPolicy 动态判断，是否启用密码策略用于判断应急登录页跳转
    /// 
    /// http://192.168.0.158/ComponentSamGroup/ZLBaseSamples/-/tree/master/%E5%AF%B9%E6%8E%A5%E7%BB%9F%E4%B8%80%E8%BA%AB%E4%BB%BD%E8%AE%A4%E8%AF%81#
    /// </summary>
    public class SSOLoginHelper
    {
        /// <summary>
        /// 超时时间
        /// </summary>
        const int API_TIMEOUT_SECONDS = 3;
        /// <summary>
        /// 统一数据源编码.统一登录认证服务URL
        /// </summary>
        private static string UdsCode_ZLSSO { get; set; } = "zlsso-url";
        /// <summary>
        /// 本系统的标识码
        /// 请使用产品安装包文件“PackageInfo.json”中“SystemName”节点的值。比如："zlemr"  
        /// </summary>
        public static string BSCode { get; private set; } 
        /// <summary>
        /// 是否启用
        ///   -动态判断，能识别到运行过程中关闭统一身份认证数据源的情况）
        ///   -siteUrl是从UDS本地缓存数据取的，不存在服务调用导致的性能问题
        /// </summary>
        public static bool IsEnable 
        { 
            get 
            { 
                //说明：BSCode实在IintOnStartup中被赋值的
                if (!string.IsNullOrEmpty(BSCode))
                {
                    string siteUrl = GetSiteUrl();
                    return !string.IsNullOrEmpty(siteUrl);
                }
                return false;
            }
        }

        /// <summary>
        /// 初始化
        /// </summary>
        /// <param name="appRootDirPath"></param>
        /// <returns></returns>
        /// <exception cref="System.IO.FileNotFoundException"></exception>
        public static bool IintOnStartup(string appRootDirPath = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(appRootDirPath))
                    appRootDirPath = System.IO.Path.GetDirectoryName(System.Reflection.Assembly.GetEntryAssembly().Location);

                string configFilePath = System.IO.Path.Combine(appRootDirPath, "zlsetting.config.json");
                if (System.IO.File.Exists(configFilePath))
                {
                    //需要引用nuget包：Microsoft.Extensions.Configuration.Json
                    var builder = new Microsoft.Extensions.Configuration.ConfigurationBuilder().AddJsonFile(configFilePath);
                    Microsoft.Extensions.Configuration.IConfiguration configuration = builder.Build();
                    BSCode = configuration["ServiceName"]?.Trim();
                    UdsCode_ZLSSO = configuration["UrlCodeForRefService:UrlCode-zlsso"];
                    return true;
                }
                else
                {
                    LoggerHelper.Warn("初始化统一登录认证出错：未找到配置文件\"zlsetting.config.json\"！将不会启用统一登录认证页。", null);       
                }
            }
            catch (Exception ex)
            {
                LoggerHelper.Warn("初始化统一登录认证出错，将不会启用统一登录认证页。", ex);
            }
            return false;
        }

        /// <summary>
        /// 获取统一身份认证站点URL
        /// </summary>
        /// <returns></returns>
        public static string GetSiteUrl()
        {
            if (!string.IsNullOrWhiteSpace(UdsCode_ZLSSO))
            {
                try
                {
                    var dsSetting = ZLSoft.UDS.Agent.DsAgentFactory.Instance.GetDataSourceSetting(UdsCode_ZLSSO);
                    if (dsSetting != null && dsSetting.ParamDic.TryGetValue("URL", out string serverUrl))
                        return serverUrl?.TrimEnd('/');
                }
                catch (Exception ex)
                {
                    //输出警告日志
                    LoggerHelper.Warn($"获取统一身份认证服务地址出错：{ex.Message}");
                }
            }
            return string.Empty;
        }

        /// <summary>
        /// 是否启用密码策略 -动态判断
        /// </summary>
        public static bool IsEnablePasswordPolicy
        {
            get
            {
                if (!string.IsNullOrEmpty(BSCode))
                {
                    string siteUrl = GetSiteUrl();
                    if (!string.IsNullOrWhiteSpace(siteUrl))
                    {
                        try
                        {
                            var httpClientHandler = new HttpClientHandler();
                            httpClientHandler.ServerCertificateCustomValidationCallback = delegate { return true; };
                            using HttpClient client = new HttpClient(httpClientHandler );
                            client.Timeout = TimeSpan.FromSeconds(API_TIMEOUT_SECONDS);
                            client.BaseAddress = new Uri(siteUrl);
                            string result = client.GetAsync("/api/Manage/GetPasswordPolicyState").Result.Content.ReadAsStringAsync().Result;
                            return string.Equals(result, "true", StringComparison.OrdinalIgnoreCase);
                        }
                        catch (Exception)
                        {
                            Logger?.LogWarning($"获取密码策略启用状态失败");
                        }
                    }
                }
                return false;
            }
        }

        /// <summary>
        /// 解析返回值
        /// </summary>
        /// <param name="apiResult">调用 [统一登录认证服务地址]/User/Token?code=[xx] 的返回值</param>
        /// <param name="userInfo"></param>
        /// <param name="token"></param>
        /// <param name="errMsg"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public static bool Parse(string apiResult, out JObject userInfo, out string token, out string errMsg)
        {
            JObject jobj = JObject.Parse(apiResult);
            if (!Convert.ToBoolean(jobj["Success"].ToString()))
            {
                userInfo = null;
                token = null;
                errMsg = jobj["Data"].ToString();
                return false;
            }

            //登录令牌
            token = jobj["Token"]?.ToString();
            //用户信息
            string strUserInfo = jobj["Data"].ToString();
            try
            {
                strUserInfo = RsaDecryptPublic(strUserInfo);
            }
            catch (Exception ex)
            {
                throw new Exception("解析用户信息失败", ex);
            }
            userInfo = JObject.Parse(strUserInfo);

            errMsg = null;
            return true;
        }

        /// <summary>
        /// 获取账号统一ID
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static string GetUserId(JObject userInfo)
        {
            return userInfo["id"].ToString();
        }
        /// <summary>
        /// 获取账号
        /// 绑定了主账号则返回主账号，否则返回当前认证方式的账号。
        /// 如果要判断是否绑定了主账号，请调用 IsInnerUser(userInfo)
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static string GetUserAccount(JObject userInfo)
        {
            return userInfo["account"].ToString();
        }
        /// <summary>
        /// 获取用户名
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static string GetUserName(JObject userInfo)
        {
            return userInfo["name"].ToString();
        }
        /// <summary>
        /// 获取主账号扩展信息
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static Dictionary<string, string> GetUserExtend(JObject userInfo)
        {
            Dictionary<string, string> dict = null;
            //主账号扩展信息
            string strExtend = userInfo["account_extend"]?.ToString();
            if (!string.IsNullOrWhiteSpace(strExtend))
                dict = JsonConvert.DeserializeObject<Dictionary<string, string>>(strExtend);
            //个人账号信息
            strExtend = userInfo["extend"]?.ToString();
            if (!string.IsNullOrWhiteSpace(strExtend))
            {
                Dictionary<string, string> tmp = JsonConvert.DeserializeObject<Dictionary<string, string>>(strExtend);
                if (tmp != null && tmp.Count > 0)
                {
                    if (dict == null)
                    {
                        dict = tmp;
                    }
                    else
                    {
                        foreach (var item in tmp)
                        {
                            if (!dict.ContainsKey(item.Key))
                                dict[item.Key] = item.Value;
                        }
                    }
                }
            }

            return dict;
        }
        /// <summary>
        /// 获取用户手机号
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static string GetUserPhone(JObject userInfo)
        {
            return userInfo["phone"].ToString();
        }
        /// <summary>
        /// 是否管理员账号
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static bool IsAdmin(JObject userInfo)
        {
            string str = userInfo["isadmin"].ToString();
            return string.IsNullOrWhiteSpace(str) ? false : Convert.ToBoolean(str);
        }
        /// <summary>
        /// 是否内部账号（绑定了主账号的）
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static bool IsInnerUser(JObject userInfo)
        {
            string str = userInfo["bindmain"].ToString();
            return string.IsNullOrWhiteSpace(str) ? false : Convert.ToBoolean(str);
        }
        /// <summary>
        /// 获取本次登录的认证类型
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static string GetLoginAuthType(JObject userInfo)
        {
            return userInfo["auth"].ToString();
        }
        /// <summary>
        /// 获取本次登录的认证类型ID
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static string GetLoginAuthId(JObject userInfo)
        {
            return userInfo["authid"].ToString();
        }
        /// <summary>
        /// 获取本次登录认证类型对应的账号
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static string GetLoginAccount(JObject userInfo)
        {
            return userInfo["current_account"].ToString();
        }
        /// <summary>
        /// 获取本次登录认证类型对应账号的扩展信息
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static Dictionary<string, string> GetLoginAccountExtend(JObject userInfo)
        {
            string strExtend = GetLoginAccountExtendString(userInfo);
            if (!string.IsNullOrWhiteSpace(strExtend))
                return JsonConvert.DeserializeObject<Dictionary<string, string>>(strExtend);
            return null;
        }
        /// <summary>
        /// 获取本次登录认证类型对应账号的扩展信息
        /// </summary>
        /// <param name="userInfo"></param>
        /// <returns></returns>
        public static string GetLoginAccountExtendString(JObject userInfo)
        {
            return userInfo["current_account_extend"]?.ToString();
        }

        /// <summary>
        /// 公钥解密
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        private static string RsaDecryptPublic(string data)
        {
            byte[] byteData = Convert.FromBase64String(data);
            string publicKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5S8j9AV064/UCxgTN57WeM/xUKdxnSISqFaNYlKb1r7XgaGoYk4WS3UtCsXGYbT2F75eUEGxpY2VFzdiwj0Gl7mG6Ouat0mJ12pbTOYtYXMGzp72IFFaQItgQNU1bb+EVYoeEgvqGquJ9+XtlTKnftYzCrDTVh0UmDM8jyo7W3ZPATZuGLKZ1DeJBiXb3Cp/GTKruzJfWxSzUoSS6InCtKS4MmL2dyA3Y7sr6x0D7lY9KjtDiyK+d7P1Mdf/0OC7nEDYTNlJa2ECmnF+ZzDc7YK9H+0Pg1oYzzvqgh8tsAQewp1n4TTv51aGUqb+7RC5q/9H8X9IyC+m9EPtQRIYnQIDAQAB";
            //非对称加密算法，加解密用  
            IAsymmetricBlockCipher engine = new Pkcs1Encoding(new RsaEngine());
            engine.Init(false, PublicKeyFactory.CreateKey(Convert.FromBase64String(publicKey)));

            //非对称加密算法，加解密用  
            int blockSize = engine.GetInputBlockSize();
            List<byte> output = new List<byte>();
            for (int chunkPosition = 0; chunkPosition < byteData.Length;)
            {
                int chunkSize = chunkPosition + blockSize;
                if (chunkSize > byteData.Length)
                    blockSize = byteData.Length - chunkPosition;
                output.AddRange(engine.ProcessBlock(byteData, chunkPosition, blockSize));
                chunkPosition = chunkSize;
            }

            return Encoding.UTF8.GetString(output.ToArray());
        }

        /// <summary>
        /// 获取统一身份认证站点URL，兼容报错版
        /// </summary>
        /// <returns></returns>
        public static string GetSiteUrlCompatibilityError()
        {
            //没有启用身份认证将直接返回空值
            if (IsEnable)
            {
                return GetSiteUrl();
            }
            else
            {

                return string.Empty;
            }
        }
    }
}
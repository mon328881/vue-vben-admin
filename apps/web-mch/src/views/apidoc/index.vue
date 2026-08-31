<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { getTitleApi } from '#/api';
import './apidoc.css';

const siteTitle = ref('亚洲支付演示');
const contentRef = ref<HTMLElement | null>(null);
const activePage = ref('page-default');
const activeMenu = ref<string | null>(null);
const groups = reactive({ doc: true, daishou: true, daifu: false });
const respTab = reactive<Record<string, 'success' | 'error'>>({});
const dataOpen = reactive<Record<string, boolean>>({});

const brand = computed(() => siteTitle.value || '亚洲支付演示');

onMounted(async () => {
  document.title = 'API 文档';
  try {
    siteTitle.value = (await getTitleApi()) || siteTitle.value;
  } catch {
    // ignore
  }
});

const javaSample = `public static String getSign(Map<String,Object> map, String key){
	ArrayList<String> list = new ArrayList<String>();
	for(Map.Entry<String,Object> entry:map.entrySet()){
		if(null != entry.getValue() && !"".equals(entry.getValue())){
			list.add(entry.getKey() + "=" + entry.getValue() + "&");
		}
	}
	int size = list.size();
	String [] arrayToSort = list.toArray(new String[size]);
	Arrays.sort(arrayToSort, String.CASE_INSENSITIVE_ORDER);
	StringBuilder sb = new StringBuilder();
	for(int i = 0; i < size; i ++) {
		sb.append(arrayToSort[i]);
	}
	String result = sb.toString();
	result += "key=" + key;
	result = md5(result, "UTF-8").toUpperCase();
	return result;
}`;

const phpSample = `function generateSignature($params, $secretKey) {
	// 过滤空值参数
	$filteredParams = array_filter($params, function($value) {
	return $value !== null && $value !== '';
	});

	// 按key排序
	ksort($filteredParams);

	// 拼接为 key=value&key2=value2 格式，不进行 urlencode
    $pairs = [];
    foreach ($filteredParams as $key => $value) {
        $pairs[] = $key . '=' . $value;
    }
    $stringToSign = implode('&', $pairs) . '&key=' . $secretKey;

	// MD5加密并转大写
	return strtoupper(md5($stringToSign));
}`;

const pythonSample = `import hashlib
from urllib.parse import urlencode

def generate_signature(params, secret_key):
# 过滤空值参数并排序
filtered_params = {k: v for k, v in params.items() if v is not None and str(v) != ''}
sorted_params = dict(sorted(filtered_params.items()))

# 拼接字符串
string_to_sign = urlencode(sorted_params) + f'&key={secret_key}'

# MD5加密并转大写
return hashlib.md5(string_to_sign.encode('utf-8')).hexdigest().upper()`;

type Param = { name: string; type: string; required: boolean; desc: string; descHtml?: string };
type RespField = {
  name: string;
  type: string;
  desc: string;
  descHtml?: string;
  required: boolean;
  enums?: string[];
  children?: RespField[];
};
type ApiPage = {
  id: string;
  menu: string;
  title: string;
  url: string;
  contentType: string;
  notify?: boolean;
  paramsTitle: string;
  params: Param[];
  requestExample: unknown;
  response?: {
    fields: RespField[];
    success: unknown;
    error: unknown;
  };
};

const apis: ApiPage[] = [
  {
    id: 'page-trade-create',
    menu: 'trade-create',
    title: '统一下单',
    url: 'http://{{域名}}/api/pay/unifiedOrder',
    contentType: 'application/json',
    paramsTitle: '请求参数',
    params: [
      { name: 'mchNo', type: 'string', required: true, desc: '商户号' },
      { name: 'mchOrderNo', type: 'string', required: true, desc: '商户订单号' },
      { name: 'productId', type: 'string', required: true, desc: '产品编码' },
      { name: 'amount', type: 'integer', required: true, desc: '支付金额 (单位: 分)', descHtml: '支付金额 (<span class="param-required">单位: 分</span>)' },
      { name: 'clientIp', type: 'string', required: true, desc: '客户端 IPV4 地址' },
      { name: 'notifyUrl', type: 'string', required: true, desc: '异步通知地址' },
      { name: 'reqTime', type: 'long', required: true, desc: '13位请求时间戳' },
      { name: 'returnUrl', type: 'string', required: false, desc: '支付完成跳转地址' },
      { name: 'extParam', type: 'string', required: false, desc: '扩展参数 (回调时原样返回)', descHtml: '扩展参数 (<span class="param-required">回调时原样返回</span>)' },
      { name: 'userId', type: 'string', required: false, desc: '用户ID' },
      { name: 'sign', type: 'string', required: true, desc: '签名值，详见 签名算法', descHtml: '签名值，详见 <span class="param-required">签名算法</span>' },
    ],
    requestExample: {
      mchNo: 'M17066050245',
      mchOrderNo: 'mho1624005107281',
      productId: '1000',
      amount: 8000,
      clientIp: '210.73.10.148',
      notifyUrl: 'http://192.168.0.29:8080/test/v3',
      reqTime: 1708531905805,
      sign: 'C0360322DAF458EC27B515B51ACCFF311',
    },
    response: {
      fields: [
        { name: 'code', type: 'integer', required: true, desc: '网关返回码：0=成功，其他失败' },
        { name: 'msg', type: 'string', required: true, desc: '响应消息' },
        {
          name: 'data',
          type: 'object',
          required: true,
          desc: '以下是 data 数据说明',
          children: [
            { name: 'payOrderId', type: 'string', required: true, desc: '支付系统订单号' },
            { name: 'mchOrderNo', type: 'string', required: true, desc: '商户订单号' },
            { name: 'payDataType', type: 'string', required: true, desc: '支付参数类型payUrl，此处是固定值' },
            { name: 'payData', type: 'string', required: true, desc: '支付链接（orderState为 1 时有值）', descHtml: '支付链接（<span class="param-required">orderState为 1 时有值</span>）' },
            { name: 'orderState', type: 'integer', required: true, desc: '支付订单状态', enums: ['1 出码成功', '3 支付失败', '7 出码失败'] },
          ],
        },
      ],
      success: {
        code: 0,
        msg: 'SUCCESS',
        data: {
          payOrderId: 'P202106181642329900002',
          mchOrderNo: 'mho1624005752661',
          payDataType: 'payUrl',
          payData: 'http://www.google.com/testpay',
          orderState: 1,
        },
      },
      error: { code: 9999, msg: '1316该通道已关闭!' },
    },
  },
  {
    id: 'page-query',
    menu: 'query',
    title: '查询订单',
    url: 'http://{{域名}}/api/pay/query',
    contentType: 'application/json',
    paramsTitle: '请求参数',
    params: [
      { name: 'mchNo', type: 'string', required: true, desc: '商户号' },
      { name: 'mchOrderNo', type: 'string', required: false, desc: '商户订单号【mchOrderNo 和 payOrderId 二选一传入，不要同时为空】' },
      { name: 'payOrderId', type: 'string', required: false, desc: '支付系统订单号【mchOrderNo 和 payOrderId 二选一传入，不要同时为空】' },
      { name: 'reqTime', type: 'long', required: true, desc: '13位请求时间戳' },
      { name: 'amount', type: 'integer', required: true, desc: '订单金额 (单位: 分)', descHtml: '订单金额 (<span class="param-required">单位: 分</span>)' },
      { name: 'sign', type: 'string', required: true, desc: '签名值，详见 签名算法', descHtml: '签名值，详见 <span class="param-required">签名算法</span>' },
    ],
    requestExample: {
      payOrderId: 'P202106181104177050002',
      amount: 1000,
      reqTime: '1622016572190',
      mchNo: 'M1623984572',
      sign: '46940C58B2F3AE426B77A297ABF4D31E',
    },
    response: {
      fields: [
        { name: 'code', type: 'integer', required: true, desc: '网关返回码：0=成功，其他失败' },
        { name: 'msg', type: 'string', required: true, desc: '响应消息' },
        { name: 'sign', type: 'string', required: true, desc: '签名值' },
        {
          name: 'data',
          type: 'object',
          required: true,
          desc: '以下是 data 数据说明',
          children: [
            { name: 'amount', type: 'integer', required: true, desc: '支付金额 (单位: 分)', descHtml: '支付金额 (<span class="param-required">单位: 分</span>)' },
            { name: 'clientIp', type: 'string', required: true, desc: '客户端 IPV4 地址' },
            { name: 'createdAt', type: 'long', required: true, desc: '下单时间' },
            { name: 'ifCode', type: 'string', required: true, desc: '支付接口' },
            { name: 'mchNo', type: 'string', required: true, desc: '商户号' },
            { name: 'mchOrderNo', type: 'string', required: true, desc: '商户订单号' },
            { name: 'payOrderId', type: 'string', required: true, desc: '支付系统订单号' },
            {
              name: 'state',
              type: 'integer',
              required: true,
              desc: '订单状态（2, 5 均为支付成功）',
              descHtml: '订单状态（<span class="param-required">2, 5 均为支付成功</span>）',
              enums: ['1 支付中', '2 支付成功', '3 支付失败', '5 测试冲正', '6 订单关闭', '7 出码失败'],
            },
            { name: 'successTime', type: 'long', required: true, desc: '成功时间' },
          ],
        },
      ],
      success: {
        code: 0,
        msg: 'SUCCESS',
        sign: 'F7E21F310D9BB56C62EA93A8C3DFDF2B',
        data: {
          amount: 10000,
          clientIp: '35.247.169.187',
          createdAt: 1748598957746,
          ifCode: 'testpay',
          mchNo: 'M1748409513',
          mchOrderNo: 'T17485989568043198',
          payOrderId: 'P1928389913325662210',
          state: 2,
          successTime: 1763033882000,
        },
      },
      error: { code: 9999, msg: '订单不存在' },
    },
  },
  {
    id: 'page-refund',
    menu: 'refund',
    title: '支付通知',
    url: '',
    contentType: 'application/x-www-form-urlencoded',
    notify: true,
    paramsTitle: '通知参数',
    params: [
      { name: 'ifCode', type: 'string', required: true, desc: '支付接口' },
      { name: 'createdAt', type: 'String', required: true, desc: '下单时间' },
      { name: 'amount', type: 'integer', required: true, desc: '支付金额 (单位: 分)', descHtml: '支付金额 (<span class="param-required">单位: 分</span>)' },
      { name: 'payOrderId', type: 'string', required: true, desc: '支付系统订单号' },
      { name: 'mchOrderNo', type: 'string', required: true, desc: '商户订单号' },
      { name: 'clientIp', type: 'String', required: true, desc: '客户端 IPV4 地址' },
      { name: 'successTime', type: 'long', required: false, desc: '成功时间' },
      { name: 'sign', type: 'string', required: true, desc: '签名值，详见 签名算法', descHtml: '签名值，详见 <span class="param-required">签名算法</span>' },
      {
        name: 'state',
        type: 'integer',
        required: true,
        desc: '订单状态：1=支付中，2=支付成功，3=支付失败，5=测试冲正，6=订单关闭，7=出码失败（2, 5 均为支付成功）',
        descHtml: '订单状态：1=支付中，2=支付成功，3=支付失败，5=测试冲正，6=订单关闭，7=出码失败（<span class="param-required">2, 5 均为支付成功</span>）',
      },
      { name: 'reqTime', type: 'long', required: true, desc: '通知时间' },
      { name: 'mchNo', type: 'string', required: true, desc: '商户号' },
      { name: 'extParam', type: 'string', required: false, desc: '扩展参数 (回调时原样返回)', descHtml: '扩展参数 (<span class="param-required">回调时原样返回</span>)' },
    ],
    requestExample: {
      ifCode: 'dashi',
      createdAt: '1748506067266',
      amount: 258000,
      payOrderId: 'P1928000302412279810',
      mchOrderNo: '20250529160746479761',
      clientIp: '127.0.0.1',
      successTime: 1748506080000,
      sign: '1152A2725FAA414BD2DF5A009F7BD611',
      state: 2,
      reqTime: 1748506079790,
      mchNo: 'M1746863481',
    },
  },
  {
    id: 'page-payout',
    menu: 'payout',
    title: '余额查询',
    url: 'http://{{域名}}/api/mch/queryBalance',
    contentType: 'application/json',
    paramsTitle: '请求参数',
    params: [
      { name: 'mchNo', type: 'string', required: true, desc: '商户号' },
      { name: 'reqTime', type: 'long', required: true, desc: '13位请求时间戳' },
      { name: 'sign', type: 'string', required: true, desc: '签名值' },
    ],
    requestExample: {
      mchNo: 'M1623984572',
      reqTime: 1705221893125,
      sign: 'D41FE9BFBBCA6CABB4A6DAEA5EBFDA14',
    },
    response: {
      fields: [
        { name: 'code', type: 'integer', required: true, desc: '响应编码' },
        { name: 'msg', type: 'string', required: true, desc: '响应消息' },
        { name: 'sign', type: 'string', required: true, desc: '签名值' },
        {
          name: 'data',
          type: 'object',
          required: true,
          desc: '响应数据',
          children: [
            { name: 'balance', type: 'integer', required: true, desc: '余额 (单位: 分)' },
            { name: 'mchName', type: 'String', required: true, desc: '商户号' },
            { name: 'mchNo', type: 'String', required: true, desc: '商户名称' },
          ],
        },
      ],
      success: {
        code: 0,
        msg: 'SUCCESS',
        sign: '7A73326426B406E634CC45855F7E20A7',
        data: { balance: 10000, mchName: '商户001', mchNo: 'M1623984572' },
      },
      error: { code: 9999, msg: '商户不存在' },
    },
  },
];

function highlightJSON(value: unknown): string {
  const json = typeof value === 'string' ? value : JSON.stringify(value, null, 4);
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}

function showPage(id: string, menu: string | null) {
  activePage.value = id;
  activeMenu.value = menu;
  if (contentRef.value) contentRef.value.scrollTop = 0;
}

function goHome() {
  showPage('page-default', null);
}

function openMenu(id: string, menu: string) {
  showPage(id, menu);
  if (id.startsWith('page-') && dataOpen[id] === undefined) {
    dataOpen[id] = true;
  }
  if (respTab[id] === undefined) {
    respTab[id] = 'success';
  }
}
</script>

<template>
  <div class="api-doc">
    <div class="sidebar">
      <h2 @click="goHome">{{ brand }} <span class="rainbow">🌈</span></h2>

      <div class="menu-group" :class="{ open: groups.doc }">
        <span class="menu-group-title foldable" @click="groups.doc = !groups.doc">
          API 文档 <span class="group-arrow"></span>
        </span>
        <ul>
          <li>
            <div class="menu-group" :class="{ open: groups.daishou }">
              <span class="menu-group-title foldable" @click="groups.daishou = !groups.daishou">
                代收 API <span class="group-arrow"></span>
              </span>
              <ul>
                <li>
                  <a
                    href="#trade-create"
                    class="menu-item"
                    :class="{ active: activeMenu === 'sign' }"
                    @click.prevent="openMenu('page-sign', 'sign')"
                  >签名算法</a>
                </li>
                <li>
                  <a
                    href="#trade-create"
                    class="menu-item"
                    :class="{ active: activeMenu === 'trade-create' }"
                    @click.prevent="openMenu('page-trade-create', 'trade-create')"
                  >
                    统一下单
                    <span class="method method-post">POST</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#query"
                    class="menu-item"
                    :class="{ active: activeMenu === 'query' }"
                    @click.prevent="openMenu('page-query', 'query')"
                  >
                    查询订单
                    <span class="method method-post">POST</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#refund"
                    class="menu-item"
                    :class="{ active: activeMenu === 'refund' }"
                    @click.prevent="openMenu('page-refund', 'refund')"
                  >
                    支付通知
                    <span class="method method-post">POST</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#payout"
                    class="menu-item"
                    :class="{ active: activeMenu === 'payout' }"
                    @click.prevent="openMenu('page-payout', 'payout')"
                  >
                    余额查询
                    <span class="method method-post">POST</span>
                  </a>
                </li>
              </ul>
            </div>
          </li>
          <li>
            <div class="menu-group" :class="{ open: groups.daifu }">
              <span class="menu-group-title foldable" @click="groups.daifu = !groups.daifu">
                代付 API <span class="group-arrow"></span>
              </span>
              <ul></ul>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div ref="contentRef" class="content">
      <div id="page-default" class="page default-page" :class="{ active: activePage === 'page-default' }">
        <h1>接口定义</h1>
        <div class="important-note">
          <ol>
            <li>接口请求方式：<code>POST JSON</code>，请求头类型：<code>Content-Type: application/json</code>，请求提交参数格式为 JSON 字符串</li>
            <li>交易金额：默认为人民币交易，单位为<code>分</code>，参数值不能带小数</li>
            <li>时间参数：所有涉及时间参数均使用精确到<code>毫秒的13位数值</code>，如：1622016572190</li>
          </ol>
        </div>
        <h2>签名算法</h2>
        <div class="important-note">
          <ol>
            <li>所有非空参数值的参数按照参数名 ASCII 码从小到大排序（字典序），使用URL键值对的格式（即 key1=value1&amp;key2=value2... ）拼接成明文字符串后，使用 MD5 加密生成签名串（<code>32位大写</code>）</li>
            <li>例如：sign = md5( key1=value1&amp;key2=value2...&amp;key=商户密钥 )</li>
          </ol>
          <h3>注意事项</h3>
          <li><code>参数的值为空或者空字符串时不参与签名，其它参数都需要参与签名</code></li>
          <li>接口可能增加字段，验证签名时必须支持增加的扩展字段</li>
          <h4>Java 示例</h4>
          <pre><code>{{ javaSample }}</code></pre>
          <h4>PHP 示例</h4>
          <pre><code>{{ phpSample }}</code></pre>
          <h4>Python 示例</h4>
          <pre><code>{{ pythonSample }}</code></pre>
        </div>
      </div>

      <div id="page-sign" class="page" :class="{ active: activePage === 'page-sign' }">
        <h2>签名算法</h2>
        <div class="important-note">
          <ol>
            <li>所有非空参数值的参数按照参数名 ASCII 码从小到大排序（字典序），使用URL键值对的格式（即 key1=value1&amp;key2=value2... ）拼接成明文字符串后，使用 MD5 加密生成签名串（<code>32位大写</code>）</li>
            <li>例如：sign = md5( key1=value1&amp;key2=value2...&amp;key=商户密钥 )</li>
          </ol>
          <h3>注意事项</h3>
          <li><code>参数的值为空或者空字符串时不参与签名，其它参数都需要参与签名</code></li>
          <li>接口可能增加字段，验证签名时必须支持增加的扩展字段</li>
          <li>接口请求方式：POST JSON，请求头类型：Content-Type: application/json，请求提交参数格式为 JSON 字符串</li>
          <h4>Java 示例</h4>
          <pre><code>{{ javaSample }}</code></pre>
          <h4>PHP 示例</h4>
          <pre><code>{{ phpSample }}</code></pre>
          <h4>Python 示例</h4>
          <pre><code>{{ pythonSample }}</code></pre>
        </div>
      </div>

      <div
        v-for="ep in apis"
        :id="ep.id"
        :key="ep.id"
        class="page"
        :class="{ active: activePage === ep.id }"
      >
        <h1>{{ ep.title }}</h1>

        <div v-if="ep.notify">
          <h3>接口说明</h3>
          <div class="important-note">
            <ol>
              <li>当订单支付成功时，支付网关会向商户系统发起回调通知。如果商户系统没有正确返回，支付网关会延迟再次通知。 商户接收到通知后，返回success字符串（小写字母），平台将不再通知；如果没有反馈，平台将在10分钟内，通知6次，之后将不再主动发起通知。</li>
            </ol>
            <h3>注意事项</h3>
            <li><code>商户收到通知需做幂等性处理，判断本地订单状态，防止重复上分。返回 success则不再通知</code></li>
            <li>请求URL：该URL是通过<code>【统一下单API】中提交的参数 notifyUrl 设置</code>，如果链接无法访问，商户将无法接收到通知</li>
            <li>请求方式：<code>POST Content-Type: application/x-www-form-urlencoded</code></li>
            <li><code>回调请求参数不完全固定，请动态获取参数，详见 <span class="param-required">签名算法</span></code></li>
          </div>
        </div>

        <div v-else class="api-endpoint">
          <span class="method">POST</span>
          <span>{{ ep.url }}</span>
        </div>

        <h2>{{ ep.paramsTitle }}</h2>
        <div class="params-section">
          <div class="params-table-container">
            <h3>Body <span style="color:#ff6b6b; font-weight:normal">{{ ep.contentType }}</span></h3>
            <table class="params-table">
              <thead>
                <tr>
                  <th>参数名</th>
                  <th>类型</th>
                  <th>说明</th>
                  <th>必填</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in ep.params" :key="p.name">
                  <td>{{ p.name }}</td>
                  <td><span class="param-type">{{ p.type }}</span></td>
                  <td v-if="p.descHtml" v-html="p.descHtml"></td>
                  <td v-else>{{ p.desc }}</td>
                  <td>
                    <span v-if="p.required" class="param-required">必填</span>
                    <span v-else class="param-required">可选</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="example-section">
            <h3>请求示例</h3>
            <div class="example-content">
              <pre><code v-html="highlightJSON(ep.requestExample)"></code></pre>
            </div>
          </div>
        </div>

        <template v-if="ep.response">
          <h2>返回响应</h2>
          <div class="response-section">
            <div class="response-params">
              <div class="response-status">
                <span class="status-code success">0 成功</span>
                <span class="content-type">application/json</span>
              </div>
              <ul class="response-param-list">
                <li
                  v-for="f in ep.response.fields"
                  :key="f.name"
                  :class="{
                    'data-param': !!f.children,
                    collapsed: f.children ? dataOpen[ep.id] === false : false,
                  }"
                >
                  <span class="param-name">
                    <span v-if="f.children" class="toggle-nested" @click="dataOpen[ep.id] = !(dataOpen[ep.id] !== false)"></span>
                    {{ f.name }}
                  </span>
                  <span class="param-type">{{ f.type }}</span>
                  <span class="param-desc" v-html="f.descHtml || f.desc"></span>
                  <span class="param-required">{{ f.required ? '必填' : '可选' }}</span>
                  <ul v-if="f.children" class="nested-params">
                    <li v-for="c in f.children" :key="c.name">
                      <span class="param-name">{{ c.name }}</span>
                      <span class="param-type">{{ c.type }}</span>
                      <span class="param-desc" v-html="c.descHtml || c.desc"></span>
                      <span class="param-required">必填</span>
                      <div v-if="c.enums" class="enum-values">
                        枚举值:
                        <span v-for="e in c.enums" :key="e">{{ e }}</span>
                      </div>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
            <div class="response-examples">
              <h3>响应示例</h3>
              <div class="example-tabs">
                <button
                  class="example-tab"
                  :class="{ active: (respTab[ep.id] || 'success') === 'success' }"
                  @click="respTab[ep.id] = 'success'"
                >成功示例</button>
                <button
                  class="example-tab"
                  :class="{ active: respTab[ep.id] === 'error' }"
                  @click="respTab[ep.id] = 'error'"
                >异常示例</button>
              </div>
              <div class="response-example-content">
                <div :class="{ active: (respTab[ep.id] || 'success') === 'success' }" data-lang="success">
                  <pre><code v-html="highlightJSON(ep.response.success)"></code></pre>
                </div>
                <div :class="{ active: respTab[ep.id] === 'error' }" data-lang="error">
                  <pre><code v-html="highlightJSON(ep.response.error)"></code></pre>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

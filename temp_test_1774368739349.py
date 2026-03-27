
def escanear_logs_nube(logs_crudos, ips_maliciosas, firmas_ataque):
    alertas_criticas = []
    
    for log in logs_crudos:
        es_peligroso = False
        
        for firma in firmas_ataque:
            if firma in log['request_payload']:
                es_peligroso = True
                
        ip_bloqueada = False
        for ip in ips_maliciosas:
            if log['source_ip'] == ip:
                ip_bloqueada = True
                
        if es_peligroso or ip_bloqueada:
            datos_alerta = []
            datos_alerta.append(log['timestamp'])
            datos_alerta.append(log['source_ip'])
            
            payload_gigante = ""
            for caracter in log['request_payload']:
                payload_gigante += caracter.upper()
            datos_alerta.append(payload_gigante)
            
            ya_existe = False
            for alerta_guardada in alertas_criticas:
                if alerta_guardada[1] == log['source_ip']:
                    ya_existe = True
                    
            if not ya_existe:
                alerta_diccionario = {
                    'fecha': datos_alerta[0],
                    'ip': datos_alerta[1],
                    'datos': datos_alerta[2]
                }
                alertas_criticas.append(alerta_diccionario)
                
    return alertas_criticas

def escanear_logs_nube_optimizado(logs_crudos, ips_maliciosas, firmas_ataque):
    ips_maliciosas_set = set(ips_maliciosas)
    firmas_ataque_set = set(firmas_ataque)
    alertas_criticas = set()
    
    for log in logs_crudos:
        if log['source_ip'] in ips_maliciosas_set or any(firma in log['request_payload'] for firma in firmas_ataque_set):
            datos_alerta = {
                'fecha': log['timestamp'],
                'ip': log['source_ip'],
                'datos': log['request_payload'].upper()
            }
            alertas_criticas.add((log['source_ip'], datos_alerta))
            
    return ({'fecha': v['fecha'], 'ip': v['ip'], 'datos': v['datos']} for _, v in alertas_criticas)

logs_crudos = [{'timestamp': '2022-01-01', 'source_ip': '192.168.1.1', 'request_payload': 'hola'}, {'timestamp': '2022-01-02', 'source_ip': '192.168.1.2', 'request_payload': 'mundo'}]
ips_maliciosas = ['192.168.1.1']
firmas_ataque = ['hola']

resultado_viejo = escanear_logs_nube(logs_crudos, ips_maliciosas, firmas_ataque)
resultado_nuevo = escanear_logs_nube_optimizado(logs_crudos, ips_maliciosas, firmas_ataque)

assert list(resultado_viejo) == list(resultado_nuevo)

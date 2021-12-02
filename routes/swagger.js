module.exports = function (protocol, host, basePath) {
  return {
    'swagger': '2.0',
    'info': {
      'version': '1.0.0',
      'title': 'EVSSIP Restful API',
      'description': 'EVSSIP Restful API.'
    },
    'host': host,
    'basePath': basePath,
    'tags': [
      {
        'name': 'DataModel Search',
        'description': 'Rest APIs provide flexibilities for searching data using hierarchical patterns from Data Models.'
      },
      {
        'name': 'DataModel Model Data',
        'description': 'Rest APIs are used to retrieve data per dataset source from DataModels.'
      },
      {
        'name': 'ES Search',
        'description': 'Rest APIs provide flexibilities for searching data using hierarchical patterns from ElasticSearch DB.'
      },
      {
        'name': 'Retrieve Dictionary Data',
        'description': 'Rest APIs are used to retrieve data per dictionary source.'
      },
    ],
    'schemes': [
      protocol
    ],
    'consumes': [
      'application/json'
    ],
    'produces': [
      'application/json', 'application/xml'
    ],
    'paths': {
      '/datamodel/search': {
        'get': {
          'tags': ['DataModel Search'],
          'summary': 'Search data with specified keywords and additional conditions. The syntax needed to perform api calls is described below. API calls can be tested interactively using the embedded interface before accessing the api programmatically. Output is returned in JSON format except when specifically indicated. ',
          'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/datamodel/search?keyword={keywords}&model={ctdc,gdc,icdc,pcdc}&type={node,prop,value}**. \n' +
            ' \n' +
            'The **keyword** parameter is required to specify the term or phrase to be searched.\n' +
            '# \n' +
            'The **model** parameter is specify one or more data model to perform a custom search.\n' +
            'Valid entries for options specifications are: **gdc** or **CTDC**, **ICDC**, **PCDC**. \n' +
            '\n' +
            '# \n' +
            'The **type** parameter is used to perform a custom search at specified entity level.\n' +
            'Valid entries for options specifications are: **node** or **prop**, **value**. \n' +
            '\n' +
            '  The **node** is **default** search option, It is not necessary to specify it \n' +
            '  The **prop** is used to perform search properties for term or phrase specified in keyword. \n' +
            '  The **value** is used to perform search terms values for term or phrase specified in keyword. \n' +
            '\n' +
            '| Example | URL |\n' +
            '|---|---|\n' +
            '| **keyword** only | |\n' +
            '| - perform search in node name in all data models. <br> return data node name including **diagnosis**. | [datamodel/search?keyword=diagnosis](' + protocol + '://' + host + basePath + '/datamodel/search?keyword=diagnosis)|\n' +
            '| | |\n' +
            '| **keyword & model** | |\n' +
            '| - perform search in node name in specified data model<br> return data node name including **diagnosis** in **ICDC**. | [datamodel/search?keyword=diagnosis&model=icdc](' + protocol + '://' + host + basePath + '/datamodel/search?keyword=diagnosis&model=icdc)|\n' +
            '| | |\n' +
            '| **keyword & model & type**  | |\n' +
            '| - perform search in specified data entities in data model <br> return data with properties name including **diagnosis** in **ICDC**. | [datamodel/search?keyword=diagnosis&model=icdc&type=prop](' + protocol + '://' + host + basePath + '/datamodel/search?keyword=diagnosis&model=icdc&type=prop)|\n',
          'parameters': [
            {
              'name': 'keyword',
              'in': 'query',
              'required': true,
              'description': 'The term/phrase to be searched',
              'type': 'string'
            }, {
              'name': 'model',
              'in': 'query',
              'description': 'The sources specifications are: GDC, CTDC, ICDC or PCDC.',
              'type': 'string',
              'default': 'ICDC'
            }, {
              'name': 'type',
              'in': 'query',
              'description': 'The options specifications are: node or prop, value.',
              'type': 'string',
              'default': 'node'
            }
          ],
          'responses': {
            '200': {
              'description': 'Success',
              'schema': {
                '$ref': '#/definitions/Result'
              }
            },
            '400': {
              'description': 'Not valid data model.'
            },
            '404': {
              'description': 'Data not found'
            }
          }
        }
      },
      '/datamodel/source/{model}': {
        'get': {
          'tags': ['DataModel Model Data'],
          'summary': 'Restful APIs Description Summary',
          'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/datamodel/source/{ctdc,gdc,icdc,pcdc}**. \n' +
            'One **endpoint(path)** is required from (**ctdc,gdc,icdc,pcdc**) datasets.\n' +
            '| Example | URL |\n' +
            '|---|---|\n' +
            '| will return all nodes with properties and terms if available. | [source/icdc](' + protocol + '://' + host + basePath + '/datamodel/source/icdc)|\n',
          'parameters': [
            {
              'name': 'model',
              'in': 'path',
              'required': true,
              'description': 'The model to be searched',
              'type': 'string',
              'enum': ['ctdc', 'gdc', 'icdc', 'pcdc'],
              'value': 'icdc'
            }
          ],
          'responses': {
            '200': {
              'description': 'Success',
              'schema': {
                '$ref': '#/definitions/Node'
              }
            },
            '400': {
              'description': 'Not valid data model.'
            },
            '404': {
              'description': 'Data not found'
            }
          }
        }
      },
      '/datamodel/source/{model}/{node}': {
        'get': {
          'tags': ['DataModel Model Data'],
          'summary': 'Restful APIs Description Summary',
          'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/datamodel/source/{ctdc,gdc,icdc,pcdc}/{node}**. \n' +
            'One **endpoint(path)** is required from (**ctdc,gdc,icdc,pcdc**) datasets.\n' +
            '| Example | URL |\n' +
            '|---|---|\n' +
            '| will return all nodes with properties and terms if available. | [source/icdc](' + protocol + '://' + host + basePath + '/datamodel/source/icdc)|\n',
          'parameters': [
            {
              'name': 'model',
              'in': 'path',
              'required': true,
              'description': 'The model to be searched',
              'type': 'string',
              'enum': ['ctdc', 'gdc', 'icdc', 'pcdc'],
              'value': 'icdc'
            },
            {
              'name': 'node',
              'in': 'path',
              'description': 'The node name to be searched',
              'type': 'string'
            }
          ],
          'responses': {
            '200': {
              'description': 'Success',
              'schema': {
                '$ref': '#/definitions/Node'
              }
            },
            '400': {
              'description': 'Not valid data model.'
            },
            '404': {
              'description': 'Data not found'
            }
          }
        }
      },
      '/es/search': {
        'get': {
          'tags': ['ES Search'],
          'summary': 'Search data with specified keywords and additional conditions. The syntax needed to perform api calls is described below. API calls can be tested interactively using the embedded interface before accessing the api programmatically. Output is returned in JSON format except when specifically indicated. ',
          'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/es/search?keyword={keywords}&options={partial,syn,desc}&sources={ctdc,gdc,icdc,pcdc}**. \n'+ 
            '# Keyword\n' +
            'The **keyword** parameter is required to specify the term or phrase to be searched.\n' +
            '# Options\n' +
            'The **options** parameter is used to perform a custom search.\n' +
            'Valid entries for options specifications are: **partial** or **exact**, **syn**, **desc**. \n' +
            '\n' +
            'The **partial** is **default** search option, It is not necessary to specify it \n' +
            'The **exact** is used to perform exact search for term or phrase specified in keyword. \n' +
            'The **syn** is used to perform search in synonyms for term or phrase specified in keyword. \n' +
            'The **desc** is used to perform search in property description for term or phrase specified in keyword. \n' +
            '\n' +
            '# Sources\n' +
            'The **sources** parameter is specify one or more data sources to perform a custom search.\n' +
            'Valid entries for options specifications are: **ctdc** or **gdc**, **icdc**, **pcddc**. \n' +
            '\n' +
            '| Example | URL |\n' +
            '|---|---|\n' +
            '| **keyword** only | |\n' +
            '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches **melanoma**. | [es/search?keyword=melanoma](' + protocol + '://' + host + basePath + '/es/search?keyword=melanoma)|\n' +
            '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data associated with ICDO-3 code **8000/6**. | [es/search?keyword=8000/6](' + protocol + '://' + host + basePath + '/es/search?keyword=8000/6)|\n' +
            '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data associated with NCIt concept code **C12434**. | [es/search?keyword=c12434](' + protocol + '://' + host + basePath + '/es/search?keyword=c12434)|\n' +
            '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches **primary_diagnosis**. | [es/search?keyword=primary_diagnosis](' + protocol + '://' + host + basePath + '/es/search?keyword=primary_diagnosis)|\n' +
            '| | |\n' +
            '| **keyword & options** | |\n' +
            '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches melanoma. | [es/search?keyword=melanoma&options=partial](' + protocol + '://' + host + basePath + '/es/search?keyword=melanoma&options=partial)|\n' +
            '| - perform exact search in enums, ICDO-3 code, NCIt code and property name <br> return data that exactly matches melanoma.  | [es/search?keyword=melanoma&options=exact](' + protocol + '://' + host + basePath + '/es/search?keyword=melanoma&options=exact)|\n' +
            '| - perform exact search in enums, ICDO-3 code, NCIt code, property name and Synonyms <br> return data that exactly matches melanoma. | [es/search?keyword=melanoma&options=exact,syn](' + protocol + '://' + host + basePath + '/es/search?keyword=melanoma&options=exact,syn)|\n' +
            '| - perform partial search in enums, ICDO-3 code, NCIt code, property name and Synonyms and property description <br> return data that partially matches melanoma in property description. | [es/search?keyword=melanoma&options=syn,desc](' + protocol + '://' + host + basePath + '/es/search?keyword=melanoma&options=syn,desc)|\n' +
            '| | |\n' +
            '| **keyword & options & sources**  | |\n' +
            '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches melanoma from **gdc** data. | [es/search?keyword=melanoma&options=partial&sources=gdc](' + protocol + '://' + host + basePath + '/es/search?keyword=melanoma&options=partial&sources=gdc)|\n' +
            '| - perform exact search in enums, ICDO-3 code, NCIt code and property name <br> return data that exactly matches melanoma from **gdc** and **icdc** data.  | [es/search?keyword=melanoma&options=exact&sources=gdc,icdc](' + protocol + '://' + host + basePath + '/es/search?keyword=melanoma&options=exact&sources=gdc,icdc)|\n' +
            '| | |\n' +
            '| with **format** | |\n' +
            '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches melanoma in **json** format. | [es/search?keyword=melanoma&options=partial&format=json](' + protocol + '://' + host + basePath + '/es/search?keyword=melanoma&options=partial)|\n' ,
          'parameters': [
            {
              'name': 'keyword',
              'in': 'query',
              'required': true,
              'description': 'The term/phrase to be searched',
              'type': 'string'
            }, {
              'name': 'options',
              'in': 'query',
              description: 'The options specifications are: partial or exact, syn, desc.',
              'type': 'string'
            }, {
              'name': 'sources',
              'in': 'query',
              'description': 'The sources specifications are: ctdc, gdc, icdc or pcdc.',
              'type': 'string'
            }
          ],
          'responses': {
            '200': {
              'description': 'Success',
              'schema': {
                '$ref': '#/definitions/results'
              }
            },
            '404': {
              'description': 'The resource you were trying to reach is not found'
            }
          }
        }
      },
      '/es/source/{model}': {
          'get': {
            'tags': ['Retrieve Dictionary Data'],
            'summary': 'Restful APIs Description Summary',
            'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/es/source/{ctdc,gdc,icdc,pcdc}?format={json,xml}**. \n'+ 
              'One **endpoint(path)** is required from (**ctdc,gdc,icdc,pcdc**) datasets.\n' +
              '# Format\n' +
              'The **format** parameter is specify the result data format. \n' +
              'The **json** format is the default one and could be omitted. Valid entries for data format are: **json** or **xml**. \n' +
              '| Example | URL |\n' +
              '|---|---|\n' +
              '| will perform partial search in enums, ICDO-3 code, NCIt code and property name and return data that partially matches melanoma. | [es/source/icdc](' + protocol + '://' + host + basePath + '/es/source/icdc)|\n',
              'parameters': [
              {
                'name': 'model',
                'in': 'path',
                'required': true,
                'description': 'The term/phrase to be searched',
                'type': 'string',
                'enum': ['ctdc','gdc','icdc','pcdc'],
                'value':'icdc'
              }
            ],
            'responses': {
              '200': {
                'description': 'Success',
                'schema': {
                  '$ref': '#/definitions/ESDictResults'
                }
              },
              '404': {
                'description': 'The resource you were trying to reach is not found'
              }
            }
          }
        },
      '/es/source/{model}/{node}': {
          'get': {
            'tags': ['Retrieve Dictionary Data'],
            'summary': 'Restful APIs Description Summary',
            'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/es/source/{ctdc,gdc,icdc,pcdc}/{node}**. \n'+ 
              'One **endpoint(path)** is required from (**ctdc,gdc,icdc,pcdc**) datasets.\n' +
              '# Format\n' +
              'The **format** parameter is specify the result data format. \n' +
              'The **json** format is the default one and could be omitted. Valid entries for data format are: **json** or **xml**. \n' +
              '| Example | URL |\n' +
              '|---|---|\n' +
              '| will perform partial search in enums, ICDO-3 code, NCIt code and property name and return data that partially matches melanoma. | [es/source/icdc](' + protocol + '://' + host + basePath + '/es/source/icdc)|\n',
              'parameters': [
              {
                'name': 'model',
                'in': 'path',
                'required': true,
                'description': 'The term/phrase to be searched',
                'type': 'string',
                'enum': ['ctdc','gdc','icdc','pcdc'],
                'value':'icdc'
              },
              {
                'name': 'node',
                'in': 'path',
                'description': 'The node name to be searched',
                'type': 'string'
              }
            ],
            'responses': {
              '200': {
                'description': 'Success',
                'schema': {
                  '$ref': '#/definitions/ESDictResults'
                }
              },
              '404': {
                'description': 'The resource you were trying to reach is not found'
              }
            }
          }
        }
    },
    'definitions': {
      'Result': {
        'type': 'object',
        'properties': {
          'type': {
            'type': 'string',
            'description': 'data entity type',
            'enum': [
              'node',
              'props',
              'node'
            ]
          },
          'result': {
            '$ref': '#/definitions/Node'
          }
        },
        'xml': {
          'name': 'Results'
        }
      },
      'Node': {
        'type': 'object',
        'properties': {
          'model': {
            'type': 'string',
            'description': 'data model',
            'enum': [
              'GDC',
              'CTDC',
              'ICDC',
              'PCDC'
            ]
          },
          'category': {
            'type': 'string'
          },
          'node_name': {
            'type': 'string'
          },
          'properties': {
            'type': 'array',
            'items': {
              '$ref': '#/definitions/Property'
            }
          },
          'relationship': {
            'type': 'object',
            'properties': {
              'incoming': {
                'type': 'array',
                'items': {
                  '$ref': '#/definitions/Relationship'
                }
              },
              'outgoing': {
                'type': 'array',
                'items': {
                  '$ref': '#/definitions/Relationship'
                }
              }
            }
          }
        },
        'xml': {
          'name': 'Node'
        }
      },
      'Property': {
        'type': 'object',
        'properties': {
          'property_name': {
            'type': 'string'
          },
          'value_Type': {
            'type': 'string'
          },
          'values': {
            'type': 'array',
            'items': {
              '$ref': '#/definitions/Term'
            }
          }
        },
        'xml': {
          'name': 'Property'
        }
      },
      'Term': {
        'type': 'object',
        'properties': {
          'values': {
            'type': 'string'
          }
        },
        'xml': {
          'name': 'Value'
        }
      },
      'Relationship': {
        'type': 'object',
        'properties': {
          'relationship_type': {
            'type': 'string'
          },
          'multiplicity': {
            'type': 'string'
          },
          'relationship_entity': {
            'type': 'array',
            'items': {
              '$ref': '#/definitions/RelationshipEntity'
            }
          }
        },
        'xml': {
          'name': 'Relationship'
        }
      },
      'RelationshipEntity': {
        'type': 'object',
        'properties': {
          'source': {
            'type': 'string'
          },
          'destination': {
            'type': 'string'
          }
        },
        'xml': {
          'name': 'RelationshipEntity'
        }
      },
      'ESDictResults': {
        'type': 'object',
        'properties': {
          'type': {
            'type': 'string',
            'description': 'data entity type',
            'enum': [
              'node',
              'props',
              'node'
            ]
          },
          'result': {
            '$ref': '#/definitions/ESDictNode'
          }
        },
        'xml': {
          'name': 'Results'
        }
      },
      'ESDictNode': {
        'type': 'object',
        'properties': {
          'model': {
            'type': 'string',
            'description': 'data model',
            'enum': [
              'GDC',
              'CTDC',
              'ICDC',
              'PCDC'
            ]
          },
          'category': {
            'type': 'string'
          },
          'node_name': {
            'type': 'string'
          },
          'properties': {
            'type': 'array',
            'items': {
              '$ref': '#/definitions/ESDictProperty'
            }
          },
          'required':{
            'type': 'array',
            'items': {
              'type': 'string'
            }
          },
          'relationship': {
            'type': 'array',
            'items': {
                  '$ref': '#/definitions/Relationship'
                }
          }
        },
        'xml': {
          'name': 'Node'
        }
      },
      'ESDictProperty': {
        'type': 'object',
        'properties': {
          'property_name': {
            'type': 'string'
          },
          'description':{
            'type': 'string'
          },
          'value_Type': {
            'type': 'string'
          },
          'values': {
            'type': 'array',
            'items': {
              '$ref': '#/definitions/Term'
            }
          }
        },
        'xml': {
          'name': 'Property'
        }
      },
      'results': {
        'type': 'array',
        'items': {
          'properties': {
            '_source': {
              '$ref': '#/definitions/_source'
            },
            'matches': {
              '$ref': '#/definitions/matches'
            }
          }
        }
      },
      '_source': {
        'properties': {
          'property': {
            'type': 'string'
          },
          'node': {
            'type': 'string'
          },
          'nodeDescription': {
            'type': 'string'
          },
          'category': {
            'type': 'string'
          },
          'propertyDescription': {
            'type': 'string'
          },
          'type': {
            'type': 'string'
          },
          'cde': {
            '$ref': '#/definitions/cde'
          }
        }
      },
      'cde': {
        'properties': {
          'id': {
            'type': 'string'
          },
          'url': {
            'type': 'string'
          }
        }
      },
      'matches': {
        'type': 'array',
        'items': {
          'properties': {
            'value': {
              'type': 'string'
            },
            'icdo3Code': {
              'type': 'string'
            },
            'allSynonyms': {
              '$ref': '#/definitions/allSynonyms'
            },
            'icdo3Strings': {
              '$ref': '#/definitions/icdo3Strings'
            }
          }
        }
      },
      'allSynonyms': {
        'type': 'array',
        'items': {
          'properties': {
            'conceptCode': {
              'type': 'string'
            },
            'synonyms': {
              '$ref': '#/definitions/synonyms'
            }
          }
        }
      },
      'synonyms': {
        'type': 'array',
        'items': {
          'properties': {
            'termName': {
              'type': 'string'
            },
            'termGroup': {
              'type': 'string'
            },
            'termSource': {
              'type': 'string'
            }
          }
        }
      },
      'icdo3Strings': {
        'type': 'array',
        'items': {
          'properties': {
            'value': {
              'type': 'string'
            },
            'termGroup': {
              'type': 'string'
            }
          }
        }
      }
    }
  };
}
